const express = require("express");
const router = express.Router();
const trafficControlService = require("../services/trafficControlService");
const smartTrafficService = require("../services/smartTrafficService");

/**
 * Traffic Control API Routes
 * Endpoints for real-time traffic management and throughput optimization
 */

// Get section occupancy status
router.get("/occupancy", async (req, res) => {
  try {
    const occupancy = await trafficControlService.getSectionOccupancy();
    res.json(occupancy);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Detect conflicts between trains
router.get("/conflicts", async (req, res) => {
  try {
    const conflicts = await trafficControlService.detectConflicts();
    res.json(conflicts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule adherence data
router.get("/adherence", async (req, res) => {
  try {
    const adherence = await trafficControlService.getScheduleAdherence();
    res.json(adherence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze delay impact on connecting trains
router.get("/delay-impact", async (req, res) => {
  try {
    const impact = await trafficControlService.analyzeDelayImpact();
    res.json(impact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get platform assignment suggestions
router.get("/platforms/:stationCode", async (req, res) => {
  try {
    const suggestions = await trafficControlService.suggestPlatformAssignment(
      req.params.stationCode
    );
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive traffic dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const dashboard = await trafficControlService.getTrafficDashboard();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI-powered predictive insights
router.get("/predictive", async (req, res) => {
  try {
    const insights = await smartTrafficService.getPredictiveInsights();
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Optimize specific train schedule
router.get("/optimize/:trainNumber", async (req, res) => {
  try {
    const optimization = await smartTrafficService.optimizeSchedule(req.params.trainNumber);
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
