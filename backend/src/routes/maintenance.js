const express = require("express");
const router = express.Router();
const Maintenance = require("../models/Maintenance");
const Section = require("../models/Section");
const { requireAuth } = require("../middleware/auth");

// Get all maintenance works
router.get("/", async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;
    
    const maintenance = await Maintenance.find(query)
      .populate("sectionId")
      .sort({ scheduledStart: 1 });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active/ongoing maintenance works
router.get("/active", async (req, res) => {
  try {
    const maintenance = await Maintenance.find({
      status: { $in: ["Scheduled", "In Progress"] }
    })
      .populate("sectionId")
      .sort({ scheduledStart: 1 });
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance by ID
router.get("/:id", async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate("sectionId")
      .populate("impactedTrains");
    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance work not found" });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new maintenance work
router.post("/", async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);
    await maintenance.save();
    res.status(201).json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update maintenance work
router.put("/:id", async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate("sectionId");
    
    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance work not found" });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start maintenance work
router.post("/:id/start", async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { 
        status: "In Progress", 
        actualStart: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("sectionId");
    
    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance work not found" });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Complete maintenance work
router.post("/:id/complete", async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { 
        status: "Completed", 
        actualEnd: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate("sectionId");
    
    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance work not found" });
    }
    res.json(maintenance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete maintenance work
router.delete("/:id", async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndDelete(req.params.id);
    if (!maintenance) {
      return res.status(404).json({ error: "Maintenance work not found" });
    }
    res.json({ message: "Maintenance work deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed sample maintenance data
router.post("/seed", async (req, res) => {
  try {
    const sections = await Section.find();
    
    const maintenanceWorks = [
      {
        sectionId: sections[0]?._id,
        title: "Track Ballast Replacement",
        description: "Replace old ballast with new granite stone on both tracks",
        type: "Track",
        priority: "High",
        status: "Scheduled",
        startStation: "New Delhi",
        endStation: "Mathura",
        scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        trackClosure: true,
        affectedTracks: 1,
        speedRestriction: 30,
        crewCount: 25,
        equipment: ["Ballast train", "Tamping machine", "Excavator"],
        estimatedDelayMinutes: 15
      },
      {
        sectionId: sections[1]?._id,
        title: "Signal Circuit Testing",
        description: "Annual testing and calibration of signaling circuits",
        type: "Signal",
        priority: "Medium",
        status: "In Progress",
        startStation: "Mathura",
        endStation: "Kota",
        scheduledStart: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        trackClosure: false,
        affectedTracks: 1,
        speedRestriction: 60,
        crewCount: 8,
        equipment: ["Testing kit", "Multimeter", "Laptop"],
        estimatedDelayMinutes: 5
      },
      {
        sectionId: sections[2]?._id,
        title: "Bridge Inspection and Repair",
        description: "Structural inspection and repair of bridge #234",
        type: "Bridge",
        priority: "Critical",
        status: "Scheduled",
        startStation: "Kota",
        endStation: "Ratlam",
        scheduledStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        trackClosure: false,
        affectedTracks: 1,
        speedRestriction: 20,
        crewCount: 15,
        equipment: ["Crane", "Welding machine", "Scaffolding"],
        estimatedDelayMinutes: 20
      },
      {
        sectionId: sections[3]?._id,
        title: "Platform Roof Repair",
        description: "Repair leaking roof at station platform 2",
        type: "Station",
        priority: "Low",
        status: "Completed",
        startStation: "Mumbai Central",
        endStation: "Mumbai Central",
        scheduledStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        actualEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        trackClosure: false,
        affectedTracks: 0,
        speedRestriction: null,
        crewCount: 5,
        equipment: ["Welding machine", "Metal sheets"],
        estimatedDelayMinutes: 0
      },
      {
        sectionId: sections[4]?._id,
        title: "Overhead Equipment Maintenance",
        description: "Inspection and maintenance of OHE pantograph contact wires",
        type: "Electrification",
        priority: "Medium",
        status: "Scheduled",
        startStation: "Howrah",
        endStation: "Kharagpur",
        scheduledStart: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        trackClosure: false,
        affectedTracks: 1,
        speedRestriction: 40,
        crewCount: 12,
        equipment: ["OHE inspection car", "Tools"],
        estimatedDelayMinutes: 8
      }
    ];
    
    await Maintenance.deleteMany({});
    const inserted = await Maintenance.insertMany(maintenanceWorks);
    res.json({ message: `Seeded ${inserted.length} maintenance works` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
