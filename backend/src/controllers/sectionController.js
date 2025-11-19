const Section = require("../models/Section");

module.exports = {
  getAllSections: async (req, res) => {
    const sections = await Section.find();
    res.json(sections);
  },

  createSection: async (req, res) => {
    const section = new Section(req.body);
    await section.save();
    res.json(section);
  },

  getSectionById: async (req, res) => {
    const section = await Section.findById(req.params.id);
    if (!section) return res.status(404).json({ error: "Section not found" });
    res.json(section);
  },

  updateSection: async (req, res) => {
    const updated = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  },

  deleteSection: async (req, res) => {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  }
};
