const express = require("express");
const Section = require("../models/Section");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const sections = await Section.find();
  res.json(sections);
});

router.post("/", requireAuth, async (req, res) => {
  const sec = new Section(req.body);
  await sec.save();
  res.json(sec);
});

module.exports = router;
