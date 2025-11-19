const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = new User({ ...req.body, passwordHash });
  await user.save();
  res.json({ ok: true });
});

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(401).json({ error: "Invalid email" });

  const ok = await user.verifyPassword(req.body.password);
  if (!ok) return res.status(401).json({ error: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET
  );

  res.json({ token });
});

module.exports = router;
