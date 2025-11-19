const express = require("express");
const aiService = require("../services/aiService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/predict-delay", requireAuth, async (req, res) => {
  res.json(await aiService.predictDelay(req.body));
});

module.exports = router;
