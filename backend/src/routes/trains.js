const express = require("express");
const Train = require("../models/Train");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const trains = await Train.find().populate("currentSection");
  res.json(trains);
});

router.post("/", requireAuth, async (req, res) => {
  const train = new Train(req.body);
  await train.save();
  res.json(train);
});

router.put("/:id", requireAuth, async (req, res) => {
  const train = await Train.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(train);
});

router.delete("/:id", requireAuth, async (req, res) => {
  await Train.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// Update train position (for real-time tracking)
router.patch("/:id/position", requireAuth, async (req, res) => {
  const { latitude, longitude, speedKmph, status } = req.body;
  const train = await Train.findByIdAndUpdate(
    req.params.id,
    { 
      latitude, 
      longitude, 
      speedKmph, 
      status,
      lastUpdated: Date.now() 
    },
    { new: true }
  );
  res.json(train);
});

module.exports = router;
