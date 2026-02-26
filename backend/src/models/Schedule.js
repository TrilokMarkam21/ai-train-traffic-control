const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true,
    index: true
  },
  stationCode: {
    type: String,
    required: true
  },
  stationName: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    default: null
  },
  departureTime: {
    type: String,
    default: null
  },
  dayOfWeek: {
    type: [String], // ["Mon", "Tue", "Wed", etc.]
    default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  distanceFromOrigin: {
    type: Number,
    default: 0
  },
  platform: {
    type: String
  },
  haltMinutes: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Schedule", scheduleSchema);
