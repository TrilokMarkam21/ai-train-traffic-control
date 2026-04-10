// ============================================================
// backend/server.js  — PRODUCTION UPGRADED
// FIX 1: Graceful shutdown on SIGTERM/SIGINT
// FIX 2: Attach io to app so controllers can access it
// FIX 3: Validate required env vars on startup
// FIX 4: Startup banner with config info
// ============================================================

require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/services/simulator");

// ─── Validate required environment variables ─────────────────
const REQUIRED_ENV = ["MONGO_URI", "JWT_SECRET"];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error("❌ Missing required environment variables:", missing.join(", "));
  console.error("   Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

const DEFAULT_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_RETRIES = 0;  // Disable port fallback - use fixed ports only

const listenOnAvailablePort = (server, startPort, maxRetries) =>
  new Promise((resolve, reject) => {
    let attempt = 0;

    const tryListen = (port) => {
      const onError = (err) => {
        server.off("listening", onListening);

        if (err.code === "EADDRINUSE" && attempt < maxRetries) {
          const nextPort = port + 1;
          attempt += 1;
          console.warn(`⚠️  Port ${port} is in use. Retrying on ${nextPort}...`);
          return tryListen(nextPort);
        }

        reject(err);
      };

      const onListening = () => {
        server.off("error", onError);
        resolve(port);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(port);
    };

    tryListen(startPort);
  });

(async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server
  const server = http.createServer(app);

  // 3. Initialize Socket.IO and attach to app for controllers
  const io = initSocket(server);
  app.set("io", io); // Makes io accessible via req.app.get("io")

  // 4. Start listening on the first available port.
  const activePort = await listenOnAvailablePort(
    server,
    DEFAULT_PORT,
    MAX_PORT_RETRIES
  );

  // Set the active port in app so controllers can access it
  app.set("activePort", activePort);

  console.log("==============================================");
  console.log("🚆  AI Train Traffic Control System  v2.0");
  console.log("==============================================");
  console.log(`✅  Backend:  http://localhost:${activePort}`);
  console.log(`✅  Env:      ${process.env.NODE_ENV || "development"}`);
  console.log(`✅  MongoDB:  ${process.env.MONGO_URI?.split("@")[1] || "local"}`);
  console.log(`✅  AI Svc:   ${process.env.AI_SERVICE_URL || "http://localhost:8000"}`);
  console.log(`✅  Frontend: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log("==============================================");

  // 5. Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🔴 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("✅  HTTP server closed.");
      const mongoose = require("mongoose");
      mongoose.connection.close(false, () => {
        console.log("✅  MongoDB connection closed.");
        process.exit(0);
      });
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error("⚠️  Forced exit after 10s timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (err) => {
    console.error("💥 Unhandled Rejection:", err.message);
    shutdown("unhandledRejection");
  });
})();
