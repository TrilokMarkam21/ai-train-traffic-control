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

module.exports = router;
