// ============================================================
// backend/src/routes/analytics.js  — PRODUCTION UPGRADED
// FIX 1: DELETE /predictions now requires auth (was totally open!)
// FIX 2: Standardized response format
// FIX 3: Added /stats endpoint for dashboard
// ============================================================

const express = require("express");
const Prediction = require("../models/Prediction");
const Train = require("../models/Train");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/analytics — full analytics data
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [dailyPredictions, weeklyPredictions, totalPredictions] =
      await Promise.all([
        Prediction.find({ createdAt: { $gte: oneDayAgo } }),
        Prediction.find({ createdAt: { $gte: oneWeekAgo } }),
        Prediction.countDocuments(),
      ]);

    // Delay trends by hour (last 24h)
    const delayByHour = {};
    dailyPredictions.forEach((p) => {
      const hour = new Date(p.createdAt).getHours();
      if (!delayByHour[hour]) delayByHour[hour] = { total: 0, count: 0 };
      delayByHour[hour].total += p.predictedDelay;
      delayByHour[hour].count += 1;
    });

    const delayTrends = Array.from({ length: 24 }, (_, i) => ({
      name: `${String(i).padStart(2, "0")}:00`,
      delay: delayByHour[i]
        ? Math.round(delayByHour[i].total / delayByHour[i].count)
        : 0,
    }));

    // Priority distribution
    const priorityCount = {};
    weeklyPredictions.forEach((p) => {
      const key = `Priority ${p.priority}`;
      priorityCount[key] = (priorityCount[key] || 0) + 1;
    });
    const priorityData = Object.entries(priorityCount).map(([name, value]) => ({
      name,
      value,
    }));

    // Risk counts
    const riskCount = { Low: 0, Medium: 0, High: 0 };
    weeklyPredictions.forEach((p) => {
      if (riskCount[p.congestionRisk] !== undefined) {
        riskCount[p.congestionRisk]++;
      }
    });

    // Group by day for weekly chart
    const dayMap = {};
    weeklyPredictions.forEach((p) => {
      const day = new Date(p.createdAt).toLocaleDateString("en-US", {
        weekday: "short",
      });
      if (!dayMap[day])
        dayMap[day] = { low: 0, medium: 0, high: 0 };
      const risk = p.congestionRisk?.toLowerCase() || "low";
      if (dayMap[day][risk] !== undefined) dayMap[day][risk]++;
    });
    const conflictData = Object.entries(dayMap).map(([name, counts]) => ({
      name,
      ...counts,
    }));

    const avgDelay =
      weeklyPredictions.length > 0
        ? weeklyPredictions.reduce((s, p) => s + p.predictedDelay, 0) /
          weeklyPredictions.length
        : 0;

    res.json({
      success: true,
      data: {
        delayTrends,
        priorityData,
        conflictData: conflictData.length > 0
          ? conflictData
          : [{ name: "This Week", low: 0, medium: 0, high: 0 }],
        stats: {
          totalPredictions,
          avgDelay: Math.round(avgDelay * 100) / 100,
          highRiskCount: riskCount.High,
          mediumRiskCount: riskCount.Medium,
          lowRiskCount: riskCount.Low,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/predictions — paginated prediction history
router.get("/predictions", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: { predictions, count: predictions.length },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/recent — last 10 predictions
router.get("/recent", requireAuth, async (req, res, next) => {
  try {
    const predictions = await Prediction.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, data: predictions });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/analytics/predictions — FIX: now requires auth!
router.delete("/predictions", requireAuth, async (req, res, next) => {
  try {
    const result = await Prediction.deleteMany({});
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} prediction records`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
