const express = require("express");
const aiService = require("../services/aiService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Main predict endpoint - public for testing (add requireAuth for production)
router.post("/predict", async (req, res) => {
  try {
    const response = await aiService.predictDelay(req.body);
    res.json(response);
  } catch (error) {
    console.error("AI prediction error:", error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

// Protected version - uncomment requireAuth for production
// router.post("/predict", requireAuth, async (req, res) => {
//   const response = await aiService.predictDelay(req.body);
//   res.json(response);
// });

// Also keep /predict-delay for backwards compatibility
router.post("/predict-delay", async (req, res) => {
  res.json(await aiService.predictDelay(req.body));
});

module.exports = router;
