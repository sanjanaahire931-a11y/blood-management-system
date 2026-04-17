const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'],
      required: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    urgency: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'FOUND', 'DONOR_ALERT', 'FULFILLED'],
      default: 'PENDING',
    },
    assignedUnit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodUnit',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model('Request', requestSchema);
