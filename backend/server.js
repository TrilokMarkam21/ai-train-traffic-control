require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/services/simulator");

const PORT = process.env.PORT || 4000;

(async () => {
  // 1. Connect to MongoDB
  await connectDB();

  // 2. Create HTTP server
  const server = http.createServer(app);

  // 3. Initialize WebSocket engine
  initSocket(server);

  // 4. Start server
  server.listen(PORT, () => {
    console.log("=============================================");
    console.log(`🚆 Backend Server Running on Port: ${PORT}`);
    console.log("=============================================");
  });
})();
