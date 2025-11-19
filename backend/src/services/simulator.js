const { Server } = require("socket.io");
const Train = require("../models/Train");

module.exports.initSocket = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });

  setInterval(async () => {
    const trains = await Train.find().populate("currentSection");
    io.emit("snapshot", trains);
  }, process.env.SIMULATION_SPEED || 1000);

  console.log("Socket.io Started");
};
