// ============================================================
// backend/src/models/Section.js  — PRODUCTION UPGRADED
// FIX 1: Was using variable name "mongooseS" — changed to standard "mongoose"
// FIX 2: Added required validators and proper types
// FIX 3: Added capacity and status for conflict detection
// FIX 4: Added indexes for frequent queries
// FIX 5: Added virtuals for occupancy percentage
// ============================================================

const mongoose = require("mongoose"); // FIX: was "mongooseS"

const sectionSchema = new mongoose.Schema(
  {
    sectionId: {
      type: String,
      required: [true, "Section ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Section name is required"],
      trim: true,
    },
    startStation: {
      type: String,
      required: [true, "Start station is required"],
      trim: true,
    },
    endStation: {
      type: String,
      required: [true, "End station is required"],
      trim: true,
    },
    lengthMeters: {
      type: Number,
      required: true,
      min: 0,
    },
    maxSpeedKmph: {
      type: Number,
      default: 120,
      min: 0,
      max: 400,
    },
    // How many trains can occupy this section simultaneously
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Which trains are currently in this section
    occupiedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Train",
      },
    ],
    status: {
      type: String,
      enum: ["Clear", "Occupied", "Congested", "Maintenance", "Blocked"],
      default: "Clear",
    },
    minHeadwaySec: {
      type: Number,
      default: 180, // 3 minutes minimum headway
    },
    // Throughput stats
    throughput: {
      trainsPerHour: { type: Number, default: 0 },
      averageDelayMinutes: { type: Number, default: 0 },
      lastCalculated: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: occupancy percentage
sectionSchema.virtual("occupancyPercentage").get(function () {
  return Math.round((this.currentOccupancy / this.capacity) * 100);
});

// Virtual: is section congested?
sectionSchema.virtual("isCongested").get(function () {
  return this.currentOccupancy >= this.capacity;
});

// Indexes
sectionSchema.index({ status: 1 });

module.exports = mongoose.model("Section", sectionSchema);
