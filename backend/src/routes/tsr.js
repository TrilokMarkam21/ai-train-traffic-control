const express = require("express");
const TSR = require("../models/TSR");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const tsr = await TSR.find().populate("section");
  res.json(tsr);
});

router.post("/", requireAuth, async (req, res) => {
  const t = new TSR(req.body);
  await t.save();
  res.json(t);
});

module.exports = router;
