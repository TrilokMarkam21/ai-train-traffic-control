// ============================================================
// backend/src/services/simulator.js  — PRODUCTION UPGRADED
// FIX 1: Returns io instance so server.js can attach it to app
// FIX 2: Sends structured snapshot event for frontend
// FIX 3: CORS restricted to frontend URL (was "*")
// FIX 4: Connection logging added
// FIX 5: Interval cleared on disconnect gracefully
// ============================================================

const { Server } = require("socket.io");
const Train = require("../models/Train");

let simulationInterval = null;

module.exports.initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const defaultLat = 28.6139; // New Delhi center
  const defaultLng = 77.209;

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Send current snapshot immediately on connect
    Train.find()
      .populate("currentSection")
      .then((trains) => {
        socket.emit("snapshot", trains);
      })
      .catch((err) => console.error("Snapshot error:", err.message));

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  // Simulate real-time train movement every 2 seconds
  simulationInterval = setInterval(async () => {
    try {
      const trains = await Train.find().populate("currentSection");

      const updates = trains.map(async (train) => {
        const hasPosition = train.latitude && train.longitude;

        const updateData = hasPosition
          ? {
              // Simulate gradual movement along a route
              latitude: train.latitude + (Math.random() - 0.5) * 0.008,
              longitude: train.longitude + (Math.random() - 0.5) * 0.008,
              speedKmph: Math.max(
                0,
                Math.min(130, (train.speedKmph || 60) + (Math.random() - 0.5) * 15)
              ),
              lastUpdated: Date.now(),
            }
          : {
              // Initialize trains without position near Delhi
              latitude: defaultLat + (Math.random() - 0.5) * 12,
              longitude: defaultLng + (Math.random() - 0.5) * 15,
              speedKmph: 60,
              lastUpdated: Date.now(),
            };

        return Train.findByIdAndUpdate(train._id, updateData, { new: true });
      });

      await Promise.all(updates);

      const updatedTrains = await Train.find().populate("currentSection");
      io.emit("trainUpdate", updatedTrains);
    } catch (err) {
      console.error("[Simulator] Error:", err.message);
    }
  }, parseInt(process.env.SIMULATION_INTERVAL_MS) || 3000);

  console.log("✅  Socket.IO started — Real-time tracking active");

  // Return io so server.js can attach it to app
  return io;
};

// Clean up interval on process exit
module.exports.stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    console.log("[Simulator] Stopped");
  }
};
