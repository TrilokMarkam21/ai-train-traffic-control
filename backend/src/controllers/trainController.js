const Train = require("../models/Train");

module.exports = {
  getAllTrains: async (req, res) => {
    const trains = await Train.find().populate("currentSection");
    res.json(trains);
  },

  createTrain: async (req, res) => {
    const train = new Train(req.body);
    await train.save();
    res.json(train);
  },

  getTrainById: async (req, res) => {
    const train = await Train.findById(req.params.id).populate("currentSection");
    if (!train) return res.status(404).json({ error: "Train not found" });
    res.json(train);
  },

  updateTrain: async (req, res) => {
    const updated = await Train.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  },

  deleteTrain: async (req, res) => {
    await Train.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  }
};
