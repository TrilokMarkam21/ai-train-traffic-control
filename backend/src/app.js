const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("express-async-errors"); // Handles async errors automatically

// Route Imports
const authRoutes = require("./routes/auth");
const trainRoutes = require("./routes/trains");
const sectionRoutes = require("./routes/sections");
const tsrRoutes = require("./routes/tsr");
const aiRoutes = require("./routes/ai");

const app = express();

// ---------------- MIDDLEWARE -----------------
app.use(cors());
app.use(morgan("dev"));
app.use(express.json()); // Built-in JSON parser

// ---------------- ROUTES ---------------------
app.use("/api/auth", authRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/tsr", tsrRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "Backend running",
    message: "AI Train Traffic Control System API",
  });
});

// ---------------- ERROR HANDLER ---------------
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);
  res.status(500).json({ error: err.message });
});

module.exports = app;
