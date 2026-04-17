const mongoose = require('mongoose');

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: 'Hospital',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    contact: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    // Blood stock per blood type — sourced from CSV or updated dynamically
    bloodStock: {
      type: Map,
      of: Number,
      default: () => {
        const stock = {};
        BLOOD_TYPES.forEach((t) => (stock[t] = 0));
        return stock;
      },
    },
    // Raw blood types listed in CSV (comma-separated string → stored as array)
    bloodTypesAvailable: {
      type: [String],
      enum: BLOOD_TYPES,
      default: [],
    },
    totalUnitsAvailable: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: is this hospital a blood bank?
hospitalSchema.virtual('isBloodBank').get(function () {
  return this.totalUnitsAvailable > 0 || this.bloodTypesAvailable.length > 0;
});

module.exports = mongoose.model('Hospital', hospitalSchema);
