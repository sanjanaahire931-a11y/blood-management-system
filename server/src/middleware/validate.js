/**
 * validate.js
 * Joi validation middleware for all API routes.
 */

const Joi = require('joi');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
});

const schemas = {
  requestBlood: Joi.object({
    bloodType: Joi.string().valid(...BLOOD_TYPES).required(),
    location: locationSchema.required(),
    urgency: Joi.string().valid('HIGH', 'MEDIUM', 'LOW').required(),
  }),

  addBlood: Joi.object({
    bloodType: Joi.string().valid(...BLOOD_TYPES).required(),
    quantity: Joi.number().integer().min(1).required(),
    expiryDate: Joi.date().greater('now').required(),
    location: locationSchema.required(),
    hospitalId: Joi.string().trim().required(),
  }),

  registerDonor: Joi.object({
    name: Joi.string().trim().min(2).required(),
    bloodType: Joi.string().valid(...BLOOD_TYPES).required(),
    location: locationSchema.required(),
    contact: Joi.string().trim().min(7).required(),
    lastDonation: Joi.date().max('now').optional().allow(null),
  }),
};

/**
 * Returns an Express middleware that validates req.body against the named schema.
 * @param {string} schemaName - Key in the schemas map
 */
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next(new Error(`Unknown validation schema: ${schemaName}`));

    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        error: true,
        message: 'Validation failed',
        code: 400,
        details: error.details.map((d) => d.message),
      });
    }
    req.body = value; // use the sanitized/coerced value
    next();
  };
}

module.exports = { validate };
