const express = require("express");
const axios = require("axios");

const aiService = require("../services/aiService");
const Prediction = require("../models/Prediction");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Protect all AI endpoints
router.use(requireAuth);

// POST /api/ai/predict
router.post("/predict", async (req, res, next) => {
  try {
    const { trainNumber, currentDelay = 0, priority = 1, trackStatus = "Clear" } =
      req.body || {};

    if (!trainNumber || String(trainNumber).trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "trainNumber is required",
      });
    }

    const result = await aiService.predictDelay({
      trainNumber: String(trainNumber).trim(),
      currentDelay: Number(currentDelay) || 0,
      priority: Number(priority) || 1,
      trackStatus,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

// Legacy alias for older frontend calls
router.post("/predict-delay", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const result = await aiService.predictDelay(payload);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/ai/service-status
router.get("/service-status", async (req, res) => {
  const aiBaseUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";

  try {
    const response = await axios.get(`${aiBaseUrl}/health`, { timeout: 2000 });
    res.json({
      success: true,
      data: {
        status: "healthy",
        url: aiBaseUrl,
        details: response.data,
      },
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      data: {
        status: "unavailable",
        url: aiBaseUrl,
      },
      message: "AI service is unavailable",
    });
  }
});

// GET /api/ai/history?limit=20
router.get("/history", async (req, res, next) => {
  try {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit)
      ? 20
      : Math.min(Math.max(requestedLimit, 1), 100);

    const predictions = await Prediction.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        predictions,
        count: predictions.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
