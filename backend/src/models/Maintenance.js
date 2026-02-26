const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Section"
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Maintenance type
  type: {
    type: String,
    enum: ["Track", "Signal", "Bridge", "Station", "Electrification", "Other"],
    default: "Track"
  },
  // Priority level
  priority: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  // Status
  status: {
    type: String,
    enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
    default: "Scheduled"
  },
  // Location details
  startStation: {
    type: String,
    required: true
  },
  endStation: {
    type: String,
    required: true
  },
  // Timing
  scheduledStart: {
    type: Date,
    required: true
  },
  scheduledEnd: {
    type: Date,
    required: true
  },
  actualStart: {
    type: Date
  },
  actualEnd: {
    type: Date
  },
  // Track closure details
  trackClosure: {
    type: Boolean,
    default: false
  },
  affectedTracks: {
    type: Number,
    default: 1
  },
  // Speed restrictions during maintenance
  speedRestriction: {
    type: Number, // km/h
    default: null
  },
  // Resources assigned
  crewCount: {
    type: Number,
    default: 0
  },
  equipment: [String],
  // Impact assessment
  impactedTrains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Train"
  }],
  estimatedDelayMinutes: {
    type: Number,
    default: 0
  },
  // Notes and updates
  notes: [String],
  // Created by
  createdBy: {
    type: String,
    default: "System"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
maintenanceSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Maintenance", maintenanceSchema);
