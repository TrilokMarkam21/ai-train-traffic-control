const express = require("express");
const Schedule = require("../models/Schedule");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Get all schedules
router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ trainNumber: 1, distanceFromOrigin: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule for a specific train
router.get("/train/:trainNumber", async (req, res) => {
  try {
    const schedules = await Schedule.find({ trainNumber: req.params.trainNumber })
      .sort({ distanceFromOrigin: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get schedule for a specific station
router.get("/station/:stationCode", async (req, res) => {
  try {
    const schedules = await Schedule.find({ stationCode: req.params.stationCode })
      .sort({ arrivalTime: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new schedule
router.post("/", async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk add schedules (seed data)
router.post("/seed", async (req, res) => {
  try {
    // Sample train schedules for major Indian trains
    const schedules = [
      // Rajdhani Express (Delhi - Mumbai)
      { trainNumber: "12951", stationCode: "NDLS", stationName: "New Delhi", arrivalTime: "", departureTime: "17:40", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 0, platform: "1" },
      { trainNumber: "12951", stationCode: "RTM", stationName: "Ratlam", arrivalTime: "23:18", departureTime: "23:20", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 660, platform: "2" },
      { trainNumber: "12951", stationCode: "BCT", stationName: "Mumbai Central", arrivalTime: "05:15", departureTime: "", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 1157, platform: "1" },
      
      // Howrah Rajdhani
      { trainNumber: "12301", stationCode: "HWH", stationName: "Howrah", arrivalTime: "", departureTime: "14:50", dayOfWeek: ["Mon", "Tue", "Thu", "Fri", "Sat"], distanceFromOrigin: 0, platform: "1" },
      { trainNumber: "12301", stationCode: "CNB", stationName: "Kanpur", arrivalTime: "21:45", departureTime: "21:53", dayOfWeek: ["Mon", "Tue", "Thu", "Fri", "Sat"], distanceFromOrigin: 979, platform: "3" },
      { trainNumber: "12301", stationCode: "NDLS", stationName: "New Delhi", arrivalTime: "08:25", departureTime: "", dayOfWeek: ["Mon", "Tue", "Thu", "Fri", "Sat"], distanceFromOrigin: 1537, platform: "2" },
      
      // Chennai Express
      { trainNumber: "12627", stationCode: "NDLS", stationName: "New Delhi", arrivalTime: "", departureTime: "23:30", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 0, platform: "5" },
      { trainNumber: "12627", stationCode: "BPL", stationName: "Bhopal", arrivalTime: "05:50", departureTime: "05:58", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 770, platform: "2" },
      { trainNumber: "12627", stationCode: "SC", stationName: "Secunderabad", arrivalTime: "14:15", departureTime: "14:25", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 1268, platform: "1" },
      { trainNumber: "12627", stationCode: "MAS", stationName: "Chennai Central", arrivalTime: "20:40", departureTime: "", dayOfWeek: ["Mon", "Wed", "Fri"], distanceFromOrigin: 2195, platform: "1" },
      
      // Bangalore Express  
      { trainNumber: "12591", stationCode: "GNT", stationName: "Gwalior", arrivalTime: "", departureTime: "06:15", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 0, platform: "1" },
      { trainNumber: "12591", stationCode: "BPL", stationName: "Bhopal", arrivalTime: "11:30", departureTime: "11:40", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 331, platform: "3" },
      { trainNumber: "12591", stationCode: "NGP", stationName: "Nagpur", arrivalTime: "16:20", departureTime: "16:30", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 670, platform: "2" },
      { trainNumber: "12591", stationCode: "SBC", stationName: "Bengaluru", arrivalTime: "06:05", departureTime: "", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 1536, platform: "1" },
      
      // Gujarat Express
      { trainNumber: "19215", stationCode: "ADI", stationName: "Ahmedabad", arrivalTime: "", departureTime: "06:20", dayOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], distanceFromOrigin: 0, platform: "1" },
      { trainNumber: "19215", stationCode: "BCT", stationName: "Mumbai Central", arrivalTime: "14:15", departureTime: "", dayOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], distanceFromOrigin: 530, platform: "3" },
      
      // Howrah - Delhi
      { trainNumber: "12306", stationCode: "HWH", stationName: "Howrah", arrivalTime: "", departureTime: "13:35", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 0, platform: "8" },
      { trainNumber: "12306", stationCode: "ASN", stationName: "Asansol", arrivalTime: "16:00", departureTime: "16:05", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 214, platform: "2" },
      { trainNumber: "12306", stationCode: "GAYA", stationName: "Gaya", arrivalTime: "19:15", departureTime: "19:20", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 445, platform: "2" },
      { trainNumber: "12306", stationCode: "CNB", stationName: "Kanpur", arrivalTime: "23:10", departureTime: "23:18", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 979, platform: "4" },
      { trainNumber: "12306", stationCode: "NDLS", stationName: "New Delhi", arrivalTime: "07:05", departureTime: "", dayOfWeek: ["Tue", "Thu", "Sat"], distanceFromOrigin: 1537, platform: "1" },
      
      // Pune - Howrah
      { trainNumber: "12849", stationCode: "PUNE", stationName: "Pune", arrivalTime: "", departureTime: "12:15", dayOfWeek: ["Wed", "Fri", "Sun"], distanceFromOrigin: 0, platform: "3" },
      { trainNumber: "12849", stationCode: "NGP", stationName: "Nagpur", arrivalTime: "21:30", departureTime: "21:45", dayOfWeek: ["Wed", "Fri", "Sun"], distanceFromOrigin: 757, platform: "4" },
      { trainNumber: "12849", stationCode: "R", stationName: "Raipur", arrivalTime: "01:10", departureTime: "01:15", dayOfWeek: ["Wed", "Fri", "Sun"], distanceFromOrigin: 1050, platform: "1" },
      { trainNumber: "12849", stationCode: "HWH", stationName: "Howrah", arrivalTime: "10:35", departureTime: "", dayOfWeek: ["Wed", "Fri", "Sun"], distanceFromOrigin: 1645, platform: "10" },
    ];
    
    await Schedule.deleteMany({});
    await Schedule.insertMany(schedules);
    res.json({ message: `Seeded ${schedules.length} schedules` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
