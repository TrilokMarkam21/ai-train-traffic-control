const express = require("express");
const Prediction = require("../models/Prediction");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get all predictions
router.get("/predictions", async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics data
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // Get predictions from last 24 hours for daily trends
    const dailyPredictions = await Prediction.find({
      createdAt: { $gte: oneDayAgo }
    });
    
    // Get predictions from last week for weekly analytics
    const weeklyPredictions = await Prediction.find({
      createdAt: { $gte: oneWeekAgo }
    });
    
    // Calculate delay trends (by hour for last 24h)
    const delayByHour = {};
    dailyPredictions.forEach(p => {
      const hour = new Date(p.createdAt).getHours();
      if (!delayByHour[hour]) {
        delayByHour[hour] = { total: 0, count: 0 };
      }
      delayByHour[hour].total += p.predictedDelay;
      delayByHour[hour].count += 1;
    });
    
    const delayTrends = [];
    for (let i = 0; i < 24; i++) {
      const hourData = delayByHour[i];
      delayTrends.push({
        name: `${i}:00`,
        delay: hourData ? Math.round(hourData.total / hourData.count) : 0
      });
    }
    
    // Priority distribution
    const priorityCount = {};
    weeklyPredictions.forEach(p => {
      const key = `Priority ${p.priority}`;
      if (!priorityCount[key]) priorityCount[key] = 0;
      priorityCount[key]++;
    });
    
    const priorityData = Object.entries(priorityCount).map(([name, value]) => ({
      name,
      value
    }));
    
    // Conflict risk distribution
    const riskCount = { Low: 0, Medium: 0, High: 0 };
    weeklyPredictions.forEach(p => {
      if (riskCount[p.congestionRisk] !== undefined) {
        riskCount[p.congestionRisk]++;
      }
    });
    
    const conflictData = [
      { name: "Week 1", low: riskCount.Low || 0, medium: riskCount.Medium || 0, high: riskCount.High || 0 }
    ];
    
    // Risk by track status
    const trackStatusRisk = {};
    weeklyPredictions.forEach(p => {
      if (!trackStatusRisk[p.trackStatus]) {
        trackStatusRisk[p.trackStatus] = { Low: 0, Medium: 0, High: 0, total: 0 };
      }
      trackStatusRisk[p.trackStatus][p.congestionRisk]++;
      trackStatusRisk[p.trackStatus].total++;
    });
    
    // Average predicted delay
    const avgDelay = weeklyPredictions.length > 0
      ? weeklyPredictions.reduce((sum, p) => sum + p.predictedDelay, 0) / weeklyPredictions.length
      : 0;
    
    // Total predictions
    const totalPredictions = await Prediction.countDocuments();
    
    res.json({
      delayTrends,
      priorityData,
      conflictData,
      trackStatusRisk,
      stats: {
        totalPredictions,
        avgDelay: Math.round(avgDelay * 100) / 100,
        highRiskCount: riskCount.High,
        mediumRiskCount: riskCount.Medium,
        lowRiskCount: riskCount.Low
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent predictions
router.get("/recent", async (req, res) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all predictions (for testing)
router.delete("/predictions", async (req, res) => {
  try {
    await Prediction.deleteMany({});
    res.json({ message: "All predictions cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
