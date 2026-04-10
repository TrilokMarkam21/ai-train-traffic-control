// ============================================================
// backend/src/routes/trains.js  — PRODUCTION UPGRADED
// FIX 1: Standardized response format { success, data, message }
// FIX 2: Added 404 handling when train not found
// FIX 3: Added input validation
// FIX 4: Removed raw res.json(train) calls
// FIX 5: Emits socket event on position update
// ============================================================

const express = require("express");
const Train = require("../models/Train");
const { requireAuth, restrictTo } = require("../middleware/auth");

const router = express.Router();

// GET /api/trains — list all trains
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { trainNumber: { $regex: search, $options: "i" } },
        { trainName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [trains, total] = await Promise.all([
      Train.find(filter)
        .populate("currentSection", "sectionId name status startStation endStation")
        .sort({ priority: 1, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Train.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: trains,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/trains/stats — aggregated stats for dashboard
router.get("/stats", requireAuth, async (req, res, next) => {
  try {
    const [overview] = await Train.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          onTime: { $sum: { $cond: [{ $eq: ["$status", "On Time"] }, 1, 0] } },
          delayed: { $sum: { $cond: [{ $eq: ["$status", "Delayed"] }, 1, 0] } },
          avgDelay: { $avg: "$delay" },
        },
      },
    ]);

    res.json({
      success: true,
      data: overview || { total: 0, onTime: 0, delayed: 0, avgDelay: 0 },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/trains/:id — single train
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const train = await Train.findById(req.params.id).populate("currentSection");
    if (!train) {
      return res.status(404).json({ success: false, message: "Train not found" });
    }
    res.json({ success: true, data: train });
  } catch (err) {
    next(err);
  }
});

// POST /api/trains — create train
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { trainNumber, trainName, source, destination } = req.body;
    if (!trainNumber?.trim() || !trainName?.trim() || !source?.trim() || !destination?.trim()) {
      return res.status(400).json({
        success: false,
        message: "trainNumber, trainName, source, and destination are required",
      });
    }

    const existing = await Train.findOne({ trainNumber: req.body.trainNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Train #${trainNumber} already exists`,
      });
    }

    const train = new Train(req.body);
    await train.save();

    // Emit real-time event
    req.app.get("io")?.emit("train:created", { train });

    res.status(201).json({
      success: true,
      message: "Train created successfully",
      data: train,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/trains/:id — update train
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const train = await Train.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("currentSection");

    if (!train) {
      return res.status(404).json({ success: false, message: "Train not found" });
    }

    // Emit real-time event
    req.app.get("io")?.emit("train:updated", { train });

    res.json({
      success: true,
      message: "Train updated successfully",
      data: train,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/trains/:id — delete train
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const train = await Train.findByIdAndDelete(req.params.id);
    if (!train) {
      return res.status(404).json({ success: false, message: "Train not found" });
    }

    req.app.get("io")?.emit("train:deleted", { trainId: req.params.id });

    res.json({ success: true, message: "Train deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/trains/:id/position — update real-time position
router.patch("/:id/position", requireAuth, async (req, res, next) => {
  try {
    const { latitude, longitude, speedKmph, status, delay } = req.body;
    const updates = { lastUpdated: Date.now() };
    if (latitude !== undefined) updates.latitude = latitude;
    if (longitude !== undefined) updates.longitude = longitude;
    if (speedKmph !== undefined) updates.speedKmph = speedKmph;
    if (status !== undefined) updates.status = status;
    if (delay !== undefined) updates.delay = delay;

    const train = await Train.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).populate("currentSection");

    if (!train) {
      return res.status(404).json({ success: false, message: "Train not found" });
    }

    // Emit position update to all connected clients
    req.app.get("io")?.emit("train:position", { train });

    res.json({ success: true, data: train });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
