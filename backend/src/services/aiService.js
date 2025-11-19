const axios = require("axios");

module.exports = {
  predictDelay: async (payload) => {
    const r = await axios.post(`${process.env.AI_SERVICE_URL}/predict_delay`, payload);
    return r.data;
  }
};
