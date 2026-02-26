const axios = require("axios");
const Prediction = require("../models/Prediction");

// AI Service URL - change this if your AI service runs on a different port
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Map frontend data to AI microservice format
 * Frontend sends: { trainNumber, currentDelay, priority, trackStatus }
 * AI microservice expects: { traffic_density, weather_score, historical_delay, signal_status }
 */
function mapToAIFormat(payload) {
  const { currentDelay, priority, trackStatus } = payload;
  
  // Map trackStatus to traffic_density (0-1) and signal_status
  let traffic_density;
  let signal_status;
  
  switch (trackStatus) {
    case "Clear":
      traffic_density = 0.2;
      signal_status = 0;
      break;
    case "Congested":
      traffic_density = 0.8;
      signal_status = 2;
      break;
    case "Under Maintenance":
      traffic_density = 0.5;
      signal_status = 1;
      break;
    case "Blocked":
      traffic_density = 0.95;
      signal_status = 2;
      break;
    default:
      traffic_density = 0.3;
      signal_status = 0;
  }
  
  // Map priority to weather_score
  let weather_score;
  switch (priority) {
    case 1:
      weather_score = 0.9;
      break;
    case 2:
      weather_score = 0.7;
      break;
    default:
      weather_score = 0.5;
  }
  
  return {
    traffic_density,
    weather_score,
    historical_delay: currentDelay || 0,
    signal_status
  };
}

/**
 * Map AI response to frontend format
 */
function mapFromAIFormat(aiResponse) {
  const riskMap = {
    "Low": "Low",
    "Medium": "Medium", 
    "High": "High"
  };
  
  let recommendation;
  if (aiResponse.congestion_risk === "High") {
    recommendation = "Immediate action required. Consider rerouting or holding train at previous station.";
  } else if (aiResponse.congestion_risk === "Medium") {
    recommendation = "Monitor closely. Prepare contingency plan if delay increases.";
  } else {
    recommendation = "Train is operating normally. Continue monitoring.";
  }
  
  return {
    predictedDelay: Math.round(aiResponse.predicted_delay_minutes * 100) / 100,
    conflictRisk: riskMap[aiResponse.congestion_risk] || "Low",
    confidence: Math.round(aiResponse.confidence_score * 100) / 100,
    recommendation
  };
}

/**
 * Save prediction to database
 */
async function savePrediction(inputData, result) {
  try {
    const prediction = new Prediction({
      trainNumber: inputData.trainNumber,
      currentDelay: inputData.currentDelay,
      trackStatus: inputData.trackStatus,
      priority: inputData.priority,
      predictedDelay: result.predictedDelay,
      congestionRisk: result.conflictRisk,
      confidenceScore: result.confidence,
      recommendation: result.recommendation
    });
    
    await prediction.save();
    console.log("Prediction saved to database:", prediction._id);
  } catch (error) {
    console.error("Error saving prediction:", error.message);
  }
}

module.exports = {
  predictDelay: async (payload) => {
    console.log("AI Service received payload:", payload);
    
    let aiResult = null;
    
    // Try to call external AI service if available
    try {
      const aiPayload = mapToAIFormat(payload);
      console.log("Sending to AI microservice:", aiPayload);
      
      const r = await axios.post(`${AI_SERVICE_URL}/v1/predict`, aiPayload, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" }
      });
      
      console.log("AI microservice response:", r.data);
      aiResult = mapFromAIFormat(r.data);
      
    } catch (e) {
      console.error("AI service error:", e.message);
      if (e.code === "ECONNREFUSED") {
        console.log("External AI service not available, using mock response");
      } else if (e.response) {
        console.error("AI service error response:", e.response.data);
      }
      
      // Fallback: Mock response
      const { currentDelay, priority, trackStatus } = payload;
      let predictedDelay = currentDelay || 0;
      if (trackStatus === "Congested") predictedDelay += Math.floor(Math.random() * 10) + 5;
      if (trackStatus === "Blocked") predictedDelay += 20;
      if (trackStatus === "Under Maintenance") predictedDelay += 15;
      predictedDelay += (priority || 1) * 2;
      
      let conflictRisk = "Low";
      if (predictedDelay > 30 || trackStatus === "Blocked") conflictRisk = "High";
      else if (predictedDelay > 15 || trackStatus === "Congested") conflictRisk = "Medium";
      
      let recommendation = "Train is operating normally. Continue monitoring.";
      if (conflictRisk === "High") {
        recommendation = "Immediate action required. Consider rerouting or holding train at previous station.";
      } else if (conflictRisk === "Medium") {
        recommendation = "Monitor closely. Prepare contingency plan if delay increases.";
      }
      
      aiResult = {
        predictedDelay,
        conflictRisk,
        confidence: 0.5,
        recommendation
      };
    }
    
    // Save prediction to database
    await savePrediction(payload, aiResult);
    
    return aiResult;
  }
};
