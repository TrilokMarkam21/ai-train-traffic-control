const express = require("express");
const router = express.Router();
const trafficControlService = require("../services/trafficControlService");
const smartTrafficService = require("../services/smartTrafficService");
const conflictService = require("../services/conflictService");

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

// Advanced conflict detection with AI-powered resolution
// Returns comprehensive conflict analysis with severity, resolution strategies, and recommendations
router.get("/conflict-analysis", async (req, res) => {
  try {
    const result = await conflictService.detectAllConflicts();
    res.json(result);
  } catch (error) {
    console.error("Advanced conflict detection error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Detect conflicts between trains - supports basic and advanced modes
router.get("/conflicts", async (req, res) => {
  try {
    const mode = req.query.mode || 'basic';
    
    if (mode === 'advanced') {
      // Advanced conflict detection with AI-powered resolution
      const result = await conflictService.detectAllConflicts();
      res.json(result);
    } else {
      // Basic conflict detection
      const conflicts = await trafficControlService.detectConflicts();
      res.json(conflicts);
    }
  } catch (error) {
    console.error("Conflict detection error:", error);
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
