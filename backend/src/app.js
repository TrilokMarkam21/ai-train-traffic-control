const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("express-async-errors");

// Route Imports
const authRoutes = require("./routes/auth");
const trainRoutes = require("./routes/trains");
const sectionRoutes = require("./routes/sections");
const tsrRoutes = require("./routes/tsr");
const aiRoutes = require("./routes/ai");
const analyticsRoutes = require("./routes/analytics");
const scheduleRoutes = require("./routes/schedules");
const trafficControlRoutes = require("./routes/trafficControl");

const app = express();

// ---------------- MIDDLEWARE -----------------
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is healthy 🚆",
  });
});

// ---------------- ROUTES ---------------------
app.use("/api/auth", authRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/tsr", tsrRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/traffic", trafficControlRoutes);
app.use("/api/analytics", analyticsRoutes);

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
