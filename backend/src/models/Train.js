const mongooseT = require("mongoose");


const TrainSchema = new mongooseT.Schema({
  trainNumber: { type: String, required: true },
  trainName: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: String },
  arrivalTime: { type: String },
  status: { type: String, default: "On Time" },
  priority: { type: Number, default: 1 },
  delay: { type: Number, default: 0 },
  currentSection: { type: mongooseT.Schema.Types.ObjectId, ref: "Section" },
  // Real-time tracking fields
  latitude: { type: Number, default: 0 },
  longitude: { type: Number, default: 0 },
  speedKmph: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});
module.exports = mongooseT.model("Train", TrainSchema);