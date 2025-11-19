const aiService = require("../services/aiService");

module.exports = {
  predictDelay: async (req, res) => {
    const response = await aiService.predictDelay(req.body);
    res.json(response);
  },

  optimizeHeadway: async (req, res) => {
    const response = await aiService.optimizeHeadway(req.body);
    res.json(response);
  },

  predictThroughput: async (req, res) => {
    const response = await aiService.predictThroughput(req.body);
    res.json(response);
  }
};
