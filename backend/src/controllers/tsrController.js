const TSR = require("../models/TSR");

module.exports = {
  getAllTSR: async (req, res) => {
    const tsr = await TSR.find().populate("section");
    res.json(tsr);
  },

  createTSR: async (req, res) => {
    const t = new TSR(req.body);
    await t.save();
    res.json(t);
  },

  getTSRById: async (req, res) => {
    const tsr = await TSR.findById(req.params.id).populate("section");
    if (!tsr) return res.status(404).json({ error: "TSR not found" });
    res.json(tsr);
  },

  updateTSR: async (req, res) => {
    const updated = await TSR.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  },

  deleteTSR: async (req, res) => {
    await TSR.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  }
};
