const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  console.log("Register request body:", req.body);
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields: name, email, password" });
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: "Email already registered" });
  }
  
  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ name, email, passwordHash });
  await user.save();
  
  // Generate token and return user immediately after registration
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET
  );
  
  res.json({ 
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
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

  // Return both token and user object
  res.json({ 
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

module.exports = router;
