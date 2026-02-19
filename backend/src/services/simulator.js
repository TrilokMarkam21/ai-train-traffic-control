const { Server } = require("socket.io");
const Train = require("../models/Train");

module.exports.initSocket = (server) => {
  const io = new Server(server, { cors: { origin: "*" } });

  // Default coordinates (India - sample rail network)
  const defaultLat = 28.6139; // Delhi
  const defaultLng = 77.2090;

  setInterval(async () => {
    try {
      // Get all trains
      const trains = await Train.find().populate("currentSection");
      
      // Simulate movement for each train
      for (const train of trains) {
        // Only update if train has a position
        if (train.latitude && train.longitude) {
          // Random movement simulation
          const latChange = (Math.random() - 0.5) * 0.01;
          const lngChange = (Math.random() - 0.5) * 0.01;
          const newSpeed = Math.max(0, Math.min(120, (train.speedKmph || 60) + (Math.random() - 0.5) * 20));
          
          await Train.findByIdAndUpdate(train._id, {
            latitude: train.latitude + latChange,
            longitude: train.longitude + lngChange,
            speedKmph: Math.round(newSpeed),
            lastUpdated: Date.now()
          });
        } else {
          // Initialize position for new trains
          await Train.findByIdAndUpdate(train._id, {
            latitude: defaultLat + (Math.random() - 0.5) * 10,
            longitude: defaultLng + (Math.random() - 0.5) * 10,
            speedKmph: 60,
            lastUpdated: Date.now()
          });
        }
      }
      
      // Get updated trains and emit
      const updatedTrains = await Train.find().populate("currentSection");
      io.emit("trainUpdate", updatedTrains);
    } catch (err) {
      console.error("Simulation error:", err.message);
    }
  }, process.env.SIMULATION_SPEED || 2000);

  console.log("Socket.io Started - Real-time tracking enabled");
};
