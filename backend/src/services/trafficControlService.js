const Train = require("../models/Train");
const Section = require("../models/Section");
const Schedule = require("../models/Schedule");

/**
 * Traffic Control Service
 * Core service for train traffic control and throughput optimization
 */
class TrafficControlService {
  
  /**
   * Get real-time section occupancy status
   * Shows which sections are busy and how many trains are in each
   */
  async getSectionOccupancy() {
    const sections = await Section.find();
    const trains = await Train.find().populate("currentSection");
    
    const occupancyMap = {};
    
    // Initialize all sections as unoccupied
    sections.forEach(section => {
      occupancyMap[section._id.toString()] = {
        sectionId: section.sectionId,
        name: section.name,
        startStation: section.startStation,
        endStation: section.endStation,
        lengthMeters: section.lengthMeters,
        maxSpeedKmph: section.maxSpeedKmph,
        minHeadwaySec: section.minHeadwaySec,
        trains: [],
        occupancyPercentage: 0,
        status: "Clear"
      };
    });
    
    // Map trains to their current sections
    trains.forEach(train => {
      if (train.currentSection) {
        const sectionId = train.currentSection._id.toString();
        if (occupancyMap[sectionId]) {
          occupancyMap[sectionId].trains.push({
            trainNumber: train.trainNumber,
            trainName: train.trainName,
            speedKmph: train.speedKmph,
            status: train.status,
            delay: train.delay,
            priority: train.priority
          });
        }
      }
    });
    
    // Calculate occupancy percentage and status
    Object.values(occupancyMap).forEach(section => {
      const trainCount = section.trains.length;
      section.occupancyPercentage = Math.min(trainCount * 50, 100); // Each train = 50%
      
      if (trainCount === 0) {
        section.status = "Clear";
      } else if (trainCount === 1) {
        section.status = "Occupied";
      } else {
        section.status = "Congested";
      }
    });
    
    return Object.values(occupancyMap);
  }

  /**
   * Detect conflicts - trains too close together (headway violations)
   * This is critical for safety and throughput
   */
  async detectConflicts() {
    const sections = await Section.find();
    const trains = await Train.find().populate("currentSection");
    const conflicts = [];
    
    // Group trains by section
    const sectionTrainsMap = {};
    trains.forEach(train => {
      if (train.currentSection) {
        const sectionId = train.currentSection._id.toString();
        if (!sectionTrainsMap[sectionId]) {
          sectionTrainsMap[sectionId] = [];
        }
        sectionTrainsMap[sectionId].push(train);
      }
    });
    
    // Check each section for conflicts
    for (const [sectionId, sectionTrainList] of Object.entries(sectionTrainsMap)) {
      if (sectionTrainList.length > 1) {
        const section = sections.find(s => s._id.toString() === sectionId);
        
        // Sort by priority (higher priority first)
        sectionTrainList.sort((a, b) => b.priority - a.priority);
        
        // Check if following trains are too close
        for (let i = 1; i < sectionTrainList.length; i++) {
          const followingTrain = sectionTrainList[i];
          const leadTrain = sectionTrainList[i - 1];
          
          // Simple conflict detection based on speed and delay difference
          const speedDiff = Math.abs(leadTrain.speedKmph - followingTrain.speedKmph);
          const delayDiff = Math.abs(leadTrain.delay - followingTrain.delay);
          
          if (speedDiff < 10 && delayDiff < 5) {
            // Trains are moving at similar speeds - potential queue
            conflicts.push({
              type: "Queue Formation",
              severity: "Warning",
              section: section?.name || "Unknown",
              trains: [
                { trainNumber: leadTrain.trainNumber, role: "Lead" },
                { trainNumber: followingTrain.trainNumber, role: "Following" }
              ],
              recommendation: `Consider adjusting speed of train ${followingTrain.trainNumber}`
            });
          }
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Schedule Adherence Tracking
   * Compare actual train positions with scheduled times
   */
  async getScheduleAdherence() {
    const trains = await Train.find();
    const schedules = await Schedule.find();
    
    // Group schedules by train
    const trainSchedules = {};
    schedules.forEach(schedule => {
      if (!trainSchedules[schedule.trainNumber]) {
        trainSchedules[schedule.trainNumber] = [];
      }
      trainSchedules[schedule.trainNumber].push(schedule);
    });
    
    const adherenceData = [];
    
    for (const train of trains) {
      const trainSchedule = trainSchedules[train.trainNumber] || [];
      
      let currentStation = null;
      let nextStation = null;
      let delayStatus = "On Time";
      
      if (train.delay > 0) {
        if (train.delay <= 5) delayStatus = "Minor Delay";
        else if (train.delay <= 15) delayStatus = "Moderate Delay";
        else delayStatus = "Major Delay";
      } else if (train.delay < 0) {
        delayStatus = "Ahead of Schedule";
      }
      
      // Find current and next station from schedule
      if (trainSchedule.length > 0) {
        const sorted = [...trainSchedule].sort((a, b) => a.distanceFromOrigin - b.distanceFromOrigin);
        
        // Simple logic to determine current/next station based on train status
        if (train.status === "On Time" || train.delay <= 5) {
          currentStation = sorted[Math.floor(sorted.length / 2)]?.stationName || "En Route";
          nextStation = sorted[sorted.length - 1]?.stationName || "Destination";
        }
      }
      
      adherenceData.push({
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        status: train.status,
        delay: train.delay,
        delayStatus,
        currentSection: train.currentSection?.name || "Unknown",
        scheduledProgress: trainSchedule.length > 0 ? 
          Math.min(100, Math.round((trainSchedule.length / 10) * 100)) : 0,
        nextStation
      });
    }
    
    return adherenceData;
  }

  /**
   * Delay Impact Analysis
   * Show how delays propagate to connecting trains
   */
  async analyzeDelayImpact() {
    const trains = await Train.find();
    const schedules = await Schedule.find();
    
    // Group by destination to find connecting trains
    const trainsByDestination = {};
    trains.forEach(train => {
      if (!trainsByDestination[train.destination]) {
        trainsByDestination[train.destination] = [];
      }
      trainsByDestination[train.destination].push(train);
    });
    
    const impactAnalysis = [];
    
    // Find delayed trains
    const delayedTrains = trains.filter(t => t.delay > 5);
    
    delayedTrains.forEach(delayedTrain => {
      // Find trains going to same destination
      const connectingTrains = trainsByDestination[delayedTrain.destination] || [];
      
      const impacted = connectingTrains.filter(t => 
        t.trainNumber !== delayedTrain.trainNumber && 
        Math.abs(t.delay - delayedTrain.delay) < delayedTrain.delay * 0.5
      );
      
      if (impacted.length > 0) {
        impactAnalysis.push({
          sourceTrain: {
            trainNumber: delayedTrain.trainNumber,
            delay: delayedTrain.delay,
            destination: delayedTrain.destination
          },
          impactedTrains: impacted.map(t => ({
            trainNumber: t.trainNumber,
            delay: t.delay
          })),
          totalImpactMinutes: impacted.reduce((sum, t) => sum + t.delay, 0),
          recommendation: `Review connection timing at ${delayedTrain.destination}`
        });
      }
    });
    
    return impactAnalysis;
  }

  /**
   * Platform Assignment Suggestions
   * Suggest optimal platform based on schedule and current usage
   */
  async suggestPlatformAssignment(stationCode) {
    const stationSchedules = await Schedule.find({ stationCode: stationCode.toUpperCase() })
      .sort({ arrivalTime: 1 });
    
    const suggestions = [];
    const usedPlatforms = new Set();
    
    for (const schedule of stationSchedules) {
      // Find available platform
      let suggestedPlatform = null;
      
      // Try to find an unused platform, or reuse one if gap is sufficient
      for (let p = 1; p <= 10; p++) {
        if (!usedPlatforms.has(p.toString())) {
          suggestedPlatform = p.toString();
          break;
        }
      }
      
      if (suggestedPlatform) {
        usedPlatforms.add(suggestedPlatform);
        suggestions.push({
          trainNumber: schedule.trainNumber,
          stationName: schedule.stationName,
          arrivalTime: schedule.arrivalTime || schedule.departureTime,
          suggestedPlatform: `Platform ${suggestedPlatform}`,
          dayOfWeek: schedule.dayOfWeek.join(", ")
        });
      }
    }
    
    return suggestions;
  }

  /**
   * Get comprehensive traffic dashboard data
   */
  async getTrafficDashboard() {
    const [occupancy, conflicts, adherence, delayImpact] = await Promise.all([
      this.getSectionOccupancy(),
      this.detectConflicts(),
      this.getScheduleAdherence(),
      this.analyzeDelayImpact()
    ]);
    
    const summary = {
      totalSections: occupancy.length,
      occupiedSections: occupancy.filter(s => s.status !== "Clear").length,
      totalConflicts: conflicts.length,
      criticalConflicts: conflicts.filter(c => c.severity === "Critical").length,
      onTimeTrains: adherence.filter(a => a.delayStatus === "On Time").length,
      delayedTrains: adherence.filter(a => a.delayStatus.includes("Delay")).length,
      avgDelayMinutes: adherence.length > 0 ? 
        Math.round(adherence.reduce((sum, a) => sum + Math.max(0, a.delay), 0) / adherence.length) : 0
    };
    
    return {
      summary,
      occupancy,
      conflicts,
      adherence,
      delayImpact,
      recommendations: this.generateRecommendations(summary, conflicts, delayImpact)
    };
  }

  /**
   * Generate AI-powered recommendations for traffic control
   */
  generateRecommendations(summary, conflicts, delayImpact) {
    const recommendations = [];
    
    // Check for capacity issues
    if (summary.occupiedSections > summary.totalSections * 0.7) {
      recommendations.push({
        type: "Capacity Alert",
        priority: "High",
        message: `${summary.occupiedSections} sections are at 70%+ capacity. Consider holding trains at originating stations.`
      });
    }
    
    // Check for conflicts
    if (summary.totalConflicts > 0) {
      recommendations.push({
        type: "Conflict Alert",
        priority: "High",
        message: `${summary.totalConflicts} potential conflicts detected. Review train spacing.`
      });
    }
    
    // Check for delays
    if (summary.delayedTrains > summary.onTimeTrains * 0.3) {
      recommendations.push({
        type: "Delay Management",
        priority: "Medium",
        message: `${summary.delayedTrains} trains delayed. Review connection times and crew scheduling.`
      });
    }
    
    // Check average delay
    if (summary.avgDelayMinutes > 10) {
      recommendations.push({
        type: "Throughput Optimization",
        priority: "Medium",
        message: `Average delay is ${summary.avgDelayMinutes} minutes. Consider speed adjustments on high-traffic sections.`
      });
    }
    
    return recommendations;
  }
}

module.exports = new TrafficControlService();
