const axios = require("axios");

module.exports = {
  predictDelay: async (payload) => {
    // Try to call external AI service if available
    try {
      if (process.env.AI_SERVICE_URL) {
        const r = await axios.post(`${process.env.AI_SERVICE_URL}/predict_delay`, payload);
        return r.data;
      }
    } catch (e) {
      console.log("External AI service not available, using mock response");
    }
    
    // Mock AI prediction response matching frontend expectations
    const { trainNumber, currentDelay, priority, trackStatus } = payload;
    
    // Calculate mock predicted delay based on inputs
    let predictedDelay = currentDelay;
    if (trackStatus === "Congested") predictedDelay += Math.floor(Math.random() * 10) + 5;
    if (trackStatus === "Blocked") predictedDelay += 20;
    if (trackStatus === "Under Maintenance") predictedDelay += 15;
    predictedDelay += priority * 2;
    
    // Determine conflict risk
    let conflictRisk = "Low";
    if (predictedDelay > 30 || trackStatus === "Blocked") conflictRisk = "High";
    else if (predictedDelay > 15 || trackStatus === "Congested") conflictRisk = "Medium";
    
    // Generate recommendation
    let recommendation = "Train is operating normally. Continue monitoring.";
    if (conflictRisk === "High") {
      recommendation = "Immediate action required. Consider rerouting or holding train at previous station.";
    } else if (conflictRisk === "Medium") {
      recommendation = "Monitor closely. Prepare contingency plan if delay increases.";
    }
    
    return {
      predictedDelay,
      conflictRisk,
      recommendation
    };
  }
};
