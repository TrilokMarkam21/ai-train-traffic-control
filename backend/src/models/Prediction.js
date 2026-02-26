const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true,
    index: true
  },
  currentDelay: {
    type: Number,
    required: true
  },
  trackStatus: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    required: true
  },
  predictedDelay: {
    type: Number,
    required: true
  },
  congestionRisk: {
    type: String,
    enum: ["Low", "Medium", "High"],
    required: true
  },
  confidenceScore: {
    type: Number
  },
  recommendation: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
predictionSchema.index({ createdAt: -1 });
predictionSchema.index({ trainNumber: 1, createdAt: -1 });

module.exports = mongoose.model("Prediction", predictionSchema);
