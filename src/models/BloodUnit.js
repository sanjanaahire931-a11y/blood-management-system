const mongoose = require('mongoose');

const bloodUnitSchema = new mongoose.Schema(
  {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    hospitalId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'RESERVED', 'EXPIRED'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

// Auto-expire units past their expiry date
bloodUnitSchema.pre('find', function () {
  this.where({ expiryDate: { $gt: new Date() } });
});

module.exports = mongoose.model('BloodUnit', bloodUnitSchema);
