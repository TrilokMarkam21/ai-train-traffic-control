const trafficControlService = require("./trafficControlService");
const aiService = require("./aiService");

/**
 * Smart Traffic Control Service
 * Integrates AI predictions with traffic control for proactive management
 */
class SmartTrafficService {
  
  /**
   * Get AI-powered traffic predictions and recommendations
   */
  async getPredictiveInsights() {
    try {
      // Get current traffic data
      const dashboard = await trafficControlService.getTrafficDashboard();
      
      // Get AI predictions for high-traffic sections
      const predictions = [];
      
      // Sample prediction request based on current occupancy
      const occupiedSections = dashboard.occupancy.filter(s => s.status !== "Clear");
      
      for (const section of occupiedSections.slice(0, 3)) {
        try {
          // Get AI prediction for this section's traffic
          const prediction = await aiService.predict({
            traffic_density: section.occupancyPercentage / 100,
            weather_score: 0.8, // Default good weather
            historical_delay: dashboard.summary.avgDelayMinutes / 60,
            signal_status: 1
          });
          
          predictions.push({
            section: section.name,
            currentOccupancy: section.occupancyPercentage,
            prediction: prediction
          });
        } catch (err) {
          console.log("AI prediction skipped for section:", section.name);
        }
      }
      
      // Generate smart recommendations
      const recommendations = this.generateSmartRecommendations(dashboard, predictions);
      
      return {
        timestamp: new Date().toISOString(),
        currentStatus: dashboard.summary,
        predictions,
        smartRecommendations: recommendations,
        throughputScore: this.calculateThroughputScore(dashboard),
        efficiencyMetrics: this.calculateEfficiencyMetrics(dashboard)
      };
    } catch (error) {
      console.error("Error in predictive insights:", error);
      return { error: error.message };
    }
  }

  /**
   * Generate smart recommendations based on AI predictions
   */
  generateSmartRecommendations(dashboard, predictions) {
    const recommendations = [];
    
    // Check predictions for congestion risk
    predictions.forEach(pred => {
      if (pred.prediction?.congestion_risk === "High") {
        recommendations.push({
          type: "Predictive Alert",
          priority: "High",
          section: pred.section,
          message: `AI predicts HIGH congestion risk on ${pred.section}. Consider rerouting or speed adjustment.`,
          action: "Pre-emptive measure"
        });
      } else if (pred.prediction?.congestion_risk === "Medium") {
        recommendations.push({
          type: "Predictive Warning",
          priority: "Medium",
          section: pred.section,
          message: `AI predicts elevated congestion on ${pred.section}. Monitor closely.`,
          action: "Monitor"
        });
      }
    });
    
    // Add recommendations from basic traffic analysis
    dashboard.recommendations.forEach(rec => {
      recommendations.push({
        ...rec,
        source: "Traffic Analysis"
      });
    });
    
    // Throughput optimization recommendations
    if (dashboard.summary.occupiedSections > dashboard.summary.totalSections * 0.5) {
      recommendations.push({
        type: "Throughput Optimization",
        priority: "Medium",
        message: "Consider implementing dynamic speed regulations to maximize throughput during high traffic.",
        action: "Speed optimization"
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate overall throughput score (0-100)
   */
  calculateThroughputScore(dashboard) {
    let score = 100;
    
    // Deduct for conflicts
    score -= dashboard.summary.totalConflicts * 15;
    
    // Deduct for delayed trains
    const delayRatio = dashboard.summary.delayedTrains / 
      Math.max(1, dashboard.summary.onTimeTrains + dashboard.summary.delayedTrains);
    score -= delayRatio * 30;
    
    // Deduct for average delay
    score -= Math.min(20, dashboard.summary.avgDelayMinutes);
    
    // Deduct for section utilization
    const utilization = dashboard.summary.occupiedSections / 
      Math.max(1, dashboard.summary.totalSections);
    if (utilization > 0.8) score -= 10;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Calculate efficiency metrics
   */
  calculateEfficiencyMetrics(dashboard) {
    const totalTrains = dashboard.summary.onTimeTrains + dashboard.summary.delayedTrains;
    
    return {
      onTimePercentage: totalTrains > 0 ? 
        Math.round((dashboard.summary.onTimeTrains / totalTrains) * 100) : 0,
      averageDelayMinutes: dashboard.summary.avgDelayMinutes,
      sectionUtilization: dashboard.summary.totalSections > 0 ?
        Math.round((dashboard.summary.occupiedSections / dashboard.summary.totalSections) * 100) : 0,
      conflictRate: dashboard.summary.totalConflicts > 0 ? "High" : "Normal",
      recommendationsCount: dashboard.recommendations.length
    };
  }

  /**
   * Optimize train scheduling based on current conditions
   */
  async optimizeSchedule(trainNumber) {
    const dashboard = await trafficControlService.getTrafficDashboard();
    const adherence = dashboard.adherence.find(a => a.trainNumber === trainNumber);
    
    if (!adherence) {
      return { error: "Train not found" };
    }
    
    const optimizations = [];
    
    // Check if train is delayed
    if (adherence.delay > 5) {
      optimizations.push({
        type: "Speed Adjustment",
        suggestion: `Increase speed by ${Math.min(10, adherence.delay)} km/h to recover delay`,
        impact: "High"
      });
    }
    
    // Check section occupancy ahead
    const occupiedSections = dashboard.occupancy.filter(s => s.status === "Congested");
    if (occupiedSections.length > 0) {
      optimizations.push({
        type: "Route Adjustment",
        suggestion: `Congestion detected ahead. Consider alternative routing.`,
        impact: "Medium"
      });
    }
    
    return {
      trainNumber,
      currentDelay: adherence.delay,
      optimizations,
      estimatedRecovery: adherence.delay > 0 ? 
        `${Math.ceil(adherence.delay * 0.8)} minutes with optimizations` : "On schedule"
    };
  }
}

module.exports = new SmartTrafficService();
