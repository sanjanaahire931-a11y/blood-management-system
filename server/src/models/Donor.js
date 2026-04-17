const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    lastDonation: {
      type: Date,
      default: null,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    isEligible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-compute isEligible: must be > 90 days since last donation
donorSchema.pre('save', function (next) {
  if (!this.lastDonation) {
    this.isEligible = true;
    return next();
  }
  const daysSince = (Date.now() - this.lastDonation.getTime()) / (1000 * 60 * 60 * 24);
  this.isEligible = daysSince > 90;
  next();
});

module.exports = mongoose.model('Donor', donorSchema);
