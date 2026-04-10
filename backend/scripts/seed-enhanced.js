require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: { type: String, select: false },
  role: { type: String, default: "controller" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const sectionSchema = new mongoose.Schema({
  sectionId: { type: String, unique: true },
  name: String,
  startStation: String,
  endStation: String,
  lengthMeters: Number,
  maxSpeedKmph: Number,
  capacity: { type: Number, default: 1 },
  currentOccupancy: { type: Number, default: 0 },
  status: { type: String, default: "Clear" },
  minHeadwaySec: { type: Number, default: 180 },
}, { timestamps: true });

const trainSchema = new mongoose.Schema({
  trainNumber: String,
  trainName: String,
  source: String,
  destination: String,
  departureTime: String,
  arrivalTime: String,
  status: { type: String, default: "On Time" },
  priority: { type: Number, default: 1 },
  delay: { type: Number, default: 0 },
  currentSection: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
  latitude: Number,
  longitude: Number,
  speedKmph: Number,
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

const predictionSchema = new mongoose.Schema({
  trainNumber: String,
  predictedDelay: Number,
  confidence: Number,
  factors: [String],
  recommendation: String,
  timestamp: { type: Date, default: Date.now },
});

const analyticsSchema = new mongoose.Schema({
  date: Date,
  totalTrains: Number,
  onTimeTrains: Number,
  delayedTrains: Number,
  averageDelay: Number,
  highPriorityCount: Number,
  congestionLevel: String,
});

// Models
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);
const Train = mongoose.models.Train || mongoose.model("Train", trainSchema);
const Prediction = mongoose.models.Prediction || mongoose.model("Prediction", predictionSchema);
const Analytics = mongoose.models.Analytics || mongoose.model("Analytics", analyticsSchema);

// Enhanced realistic sections with major Indian routes
const sections = [
  // Delhi to Mumbai route
  {
    sectionId: "SEC-DEL-MTR",
    name: "Delhi-Mathura",
    startStation: "New Delhi",
    endStation: "Mathura",
    lengthMeters: 141000,
    maxSpeedKmph: 130,
    capacity: 2,
    currentOccupancy: 1,
    status: "Clear",
    minHeadwaySec: 180,
  },
  {
    sectionId: "SEC-MTR-AGR",
    name: "Mathura-Agra",
    startStation: "Mathura",
    endStation: "Agra",
    lengthMeters: 55000,
    maxSpeedKmph: 120,
    capacity: 1,
    currentOccupancy: 1,
    status: "Occupied",
    minHeadwaySec: 240,
  },
  {
    sectionId: "SEC-AGR-GWL",
    name: "Agra-Gwalior",
    startStation: "Agra",
    endStation: "Gwalior",
    lengthMeters: 120000,
    maxSpeedKmph: 110,
    capacity: 1,
    currentOccupancy: 1,
    status: "Occupied",
    minHeadwaySec: 300,
  },
  {
    sectionId: "SEC-GWL-BPL",
    name: "Gwalior-Bhopal",
    startStation: "Gwalior",
    endStation: "Bhopal",
    lengthMeters: 423000,
    maxSpeedKmph: 130,
    capacity: 2,
    currentOccupancy: 2,
    status: "Congested",
    minHeadwaySec: 120,
  },
  {
    sectionId: "SEC-BPL-ITRY",
    name: "Bhopal-Itarsi",
    startStation: "Bhopal",
    endStation: "Itarsi",
    lengthMeters: 78000,
    maxSpeedKmph: 120,
    capacity: 2,
    currentOccupancy: 1,
    status: "Clear",
    minHeadwaySec: 180,
  },
  {
    sectionId: "SEC-ITRY-BSL",
    name: "Itarsi-Burhanpur",
    startStation: "Itarsi",
    endStation: "Burhanpur",
    lengthMeters: 108000,
    maxSpeedKmph: 110,
    capacity: 1,
    currentOccupancy: 0,
    status: "Clear",
    minHeadwaySec: 240,
  },
  {
    sectionId: "SEC-BSL-MUM",
    name: "Burhanpur-Mumbai",
    startStation: "Burhanpur",
    endStation: "Mumbai Central",
    lengthMeters: 356000,
    maxSpeedKmph: 130,
    capacity: 2,
    currentOccupancy: 1,
    status: "Clear",
    minHeadwaySec: 180,
  },

  // Delhi to Kolkata route
  {
    sectionId: "SEC-DEL-HWH",
    name: "New Delhi-Howrah",
    startStation: "New Delhi",
    endStation: "Howrah",
    lengthMeters: 1472000,
    maxSpeedKmph: 130,
    capacity: 2,
    currentOccupancy: 2,
    status: "Congested",
    minHeadwaySec: 120,
  },
  {
    sectionId: "SEC-HWH-ASN",
    name: "Howrah-Asansol",
    startStation: "Howrah",
    endStation: "Asansol",
    lengthMeters: 214000,
    maxSpeedKmph: 120,
    capacity: 2,
    currentOccupancy: 2,
    status: "Congested",
    minHeadwaySec: 120,
  },
  {
    sectionId: "SEC-ASN-KPH",
    name: "Asansol-Katihar",
    startStation: "Asansol",
    endStation: "Katihar",
    lengthMeters: 368000,
    maxSpeedKmph: 110,
    capacity: 1,
    currentOccupancy: 0,
    status: "Clear",
    minHeadwaySec: 180,
  },

  // Mumbai to Bangalore route
  {
    sectionId: "SEC-MUM-PUNE",
    name: "Mumbai-Pune",
    startStation: "Mumbai Central",
    endStation: "Pune",
    lengthMeters: 192000,
    maxSpeedKmph: 120,
    capacity: 2,
    currentOccupancy: 1,
    status: "Clear",
    minHeadwaySec: 180,
  },
  {
    sectionId: "SEC-PUNE-SHO",
    name: "Pune-Sholapur",
    startStation: "Pune",
    endStation: "Sholapur",
    lengthMeters: 248000,
    maxSpeedKmph: 110,
    capacity: 1,
    currentOccupancy: 1,
    status: "Occupied",
    minHeadwaySec: 240,
  },
  {
    sectionId: "SEC-SHO-HANG",
    name: "Sholapur-Bangalore",
    startStation: "Sholapur",
    endStation: "Bangalore",
    lengthMeters: 560000,
    maxSpeedKmph: 120,
    capacity: 2,
    currentOccupancy: 0,
    status: "Clear",
    minHeadwaySec: 180,
  },

  // Chennai-Delhi route
  {
    sectionId: "SEC-CHM-MDR",
    name: "Chennai-Madras",
    startStation: "Chennai Central",
    endStation: "Madras",
    lengthMeters: 50000,
    maxSpeedKmph: 110,
    capacity: 1,
    currentOccupancy: 1,
    status: "Occupied",
    minHeadwaySec: 240,
  },
];

// Enhanced realistic trains with diverse scenarios
const trains = [
  // Rajdhani Express (High Priority)
  {
    trainNumber: "12951",
    trainName: "Mumbai Rajdhani Express",
    source: "New Delhi",
    destination: "Mumbai Central",
    departureTime: "17:40",
    arrivalTime: "05:15",
    status: "On Time",
    priority: 1,
    delay: 0,
    latitude: 28.6139,
    longitude: 77.2090,
    speedKmph: 125,
  },
  {
    trainNumber: "12301",
    trainName: "Howrah Rajdhani Express",
    source: "New Delhi",
    destination: "Howrah",
    departureTime: "14:50",
    arrivalTime: "08:25",
    status: "Delayed",
    priority: 1,
    delay: 18,
    latitude: 26.5000,
    longitude: 84.0000,
    speedKmph: 95,
  },
  {
    trainNumber: "12431",
    trainName: "Lucknow Mail",
    source: "New Delhi",
    destination: "Lucknow",
    departureTime: "12:20",
    arrivalTime: "22:30",
    status: "On Time",
    priority: 1,
    delay: 0,
    latitude: 28.4089,
    longitude: 77.7064,
    speedKmph: 120,
  },

  // Express trains (Medium Priority)
  {
    trainNumber: "12627",
    trainName: "Karnataka Express",
    source: "New Delhi",
    destination: "Chennai Central",
    departureTime: "23:30",
    arrivalTime: "20:40",
    status: "On Time",
    priority: 2,
    delay: 0,
    latitude: 26.4499,
    longitude: 80.3319,
    speedKmph: 100,
  },
  {
    trainNumber: "19215",
    trainName: "Gujarat Express",
    source: "Ahmedabad",
    destination: "Mumbai Central",
    departureTime: "06:20",
    arrivalTime: "14:15",
    status: "Slightly Delayed",
    priority: 2,
    delay: 5,
    latitude: 23.0225,
    longitude: 72.5714,
    speedKmph: 85,
  },
  {
    trainNumber: "12849",
    trainName: "Pune-Howrah Express",
    source: "Pune",
    destination: "Howrah",
    departureTime: "12:15",
    arrivalTime: "10:35",
    status: "In Transit",
    priority: 2,
    delay: 8,
    latitude: 19.5904,
    longitude: 75.5941,
    speedKmph: 90,
  },
  {
    trainNumber: "12265",
    trainName: "Bhopal Express",
    source: "Bhopal",
    destination: "Mumbai Central",
    departureTime: "08:45",
    arrivalTime: "16:00",
    status: "On Time",
    priority: 2,
    delay: 0,
    latitude: 23.1815,
    longitude: 79.9864,
    speedKmph: 110,
  },
  {
    trainNumber: "14715",
    trainName: "Shershah Express",
    source: "New Delhi",
    destination: "Patna",
    departureTime: "03:15",
    arrivalTime: "15:40",
    status: "Delayed",
    priority: 2,
    delay: 12,
    latitude: 27.7172,
    longitude: 85.3240,
    speedKmph: 80,
  },

  // Passenger trains (Lower Priority)
  {
    trainNumber: "12591",
    trainName: "Gorakhpur Express",
    source: "Gwalior",
    destination: "Bengaluru",
    departureTime: "06:15",
    arrivalTime: "06:05",
    status: "Significantly Delayed",
    priority: 3,
    delay: 32,
    latitude: 26.2124,
    longitude: 78.1772,
    speedKmph: 70,
  },
  {
    trainNumber: "11015",
    trainName: "Dadar Express",
    source: "Mumbai Central",
    destination: "Bangalore",
    departureTime: "05:30",
    arrivalTime: "20:45",
    status: "On Time",
    priority: 3,
    delay: 0,
    latitude: 18.5204,
    longitude: 73.8567,
    speedKmph: 75,
  },
  {
    trainNumber: "16795",
    trainName: "Bangalore City Express",
    source: "Bangalore",
    destination: "Hyderabad",
    departureTime: "18:30",
    arrivalTime: "02:00",
    status: "In Transit",
    priority: 3,
    delay: 15,
    latitude: 13.1939,
    longitude: 77.5941,
    speedKmph: 85,
  },
  {
    trainNumber: "18567",
    trainName: "Jaipur Intercity",
    source: "New Delhi",
    destination: "Jaipur",
    departureTime: "07:00",
    arrivalTime: "11:30",
    status: "On Time",
    priority: 3,
    delay: 0,
    latitude: 27.5941,
    longitude: 77.2064,
    speedKmph: 110,
  },
  {
    trainNumber: "20452",
    trainName: "Visakhapatnam Express",
    source: "Visakhapatnam",
    destination: "New Delhi",
    departureTime: "19:10",
    arrivalTime: "14:40",
    status: "Slightly Delayed",
    priority: 2,
    delay: 7,
    latitude: 17.6869,
    longitude: 83.2185,
    speedKmph: 95,
  },
  {
    trainNumber: "18209",
    trainName: "Shalimar Express",
    source: "Howrah",
    destination: "New Delhi",
    departureTime: "11:55",
    arrivalTime: "04:00",
    status: "Delayed",
    priority: 1,
    delay: 22,
    latitude: 24.8407,
    longitude: 81.8496,
    speedKmph: 100,
  },
  {
    trainNumber: "15902",
    trainName: "Golden Temple Mail",
    source: "Amritsar",
    destination: "Mumbai Central",
    departureTime: "15:35",
    arrivalTime: "15:05",
    status: "On Time",
    priority: 2,
    delay: 0,
    latitude: 31.6340,
    longitude: 74.8711,
    speedKmph: 115,
  },
  {
    trainNumber: "12216",
    trainName: "Intercity Express",
    source: "Chandigarh",
    destination: "Delhi",
    departureTime: "09:15",
    arrivalTime: "12:10",
    status: "On Time",
    priority: 3,
    delay: 0,
    latitude: 30.7333,
    longitude: 76.7794,
    speedKmph: 90,
  },
];

// Sample predictions for realistic demo
const predictions = [
  {
    trainNumber: "12951",
    predictedDelay: 2,
    confidence: 0.92,
    factors: ["Normal weather conditions", "Clear track conditions", "High priority route"],
    recommendation: "All systems normal. Maintain current schedule.",
  },
  {
    trainNumber: "12301",
    predictedDelay: 25,
    confidence: 0.88,
    factors: ["Track congestion on AGR-GWL section", "High traffic volume", "Morning peak hours"],
    recommendation: "Consider alternate routing. Expected delays: 20-30 minutes",
  },
  {
    trainNumber: "12627",
    predictedDelay: 5,
    confidence: 0.85,
    factors: ["Light signals maintenance", "Mild delays anticipated"],
    recommendation: "Monitor track status. Minor delays possible.",
  },
];

// Analytics data for the past week
const analyticsData = [
  {
    date: new Date(new Date().setDate(new Date().getDate() - 6)),
    totalTrains: 156,
    onTimeTrains: 142,
    delayedTrains: 14,
    averageDelay: 3.2,
    highPriorityCount: 45,
    congestionLevel: "Low",
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 5)),
    totalTrains: 159,
    onTimeTrains: 138,
    delayedTrains: 21,
    averageDelay: 5.8,
    highPriorityCount: 48,
    congestionLevel: "Medium",
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 4)),
    totalTrains: 162,
    onTimeTrains: 151,
    delayedTrains: 11,
    averageDelay: 2.1,
    highPriorityCount: 50,
    congestionLevel: "Low",
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 3)),
    totalTrains: 158,
    onTimeTrains: 132,
    delayedTrains: 26,
    averageDelay: 8.5,
    highPriorityCount: 52,
    congestionLevel: "High",
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 2)),
    totalTrains: 161,
    onTimeTrains: 145,
    delayedTrains: 16,
    averageDelay: 4.2,
    highPriorityCount: 49,
    congestionLevel: "Medium",
  },
  {
    date: new Date(new Date().setDate(new Date().getDate() - 1)),
    totalTrains: 160,
    onTimeTrains: 148,
    delayedTrains: 12,
    averageDelay: 3.5,
    highPriorityCount: 51,
    congestionLevel: "Low",
  },
  {
    date: new Date(),
    totalTrains: 157,
    onTimeTrains: 141,
    delayedTrains: 16,
    averageDelay: 4.7,
    highPriorityCount: 47,
    congestionLevel: "Medium",
  },
];

async function seed() {
  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai_train_traffic";

  console.log("\n🚀 Starting Enhanced Database Seed...");
  console.log("📊 Creating comprehensive dataset for presentation");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected\n");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Train.deleteMany({}),
    Section.deleteMany({}),
    Prediction.deleteMany({}),
    Analytics.deleteMany({}),
  ]);
  console.log("✅ Data cleared\n");

  // Seed sections
  console.log("📍 Seeding sections...");
  const createdSections = await Section.insertMany(sections);
  console.log(`✅ Created ${createdSections.length} railway sections\n`);

  // Seed trains
  console.log("🚆 Seeding trains...");
  const trainsWithSections = trains.map((train, i) => ({
    ...train,
    currentSection: createdSections[i % createdSections.length]._id,
  }));
  const createdTrains = await Train.insertMany(trainsWithSections);
  console.log(`✅ Created ${createdTrains.length} trains with diverse statuses\n`);

  // Seed predictions
  console.log("🤖 Seeding predictions...");
  const createdPredictions = await Prediction.insertMany(predictions);
  console.log(`✅ Created ${createdPredictions.length} AI predictions\n`);

  // Seed analytics
  console.log("📈 Seeding analytics data...");
  const createdAnalytics = await Analytics.insertMany(analyticsData);
  console.log(`✅ Created ${createdAnalytics.length} analytics records\n`);

  // Seed users
  console.log("👥 Seeding users...");
  const adminHash = await bcrypt.hash("admin123", 10);
  const operatorHash = await bcrypt.hash("operator123", 10);
  const controllerHash = await bcrypt.hash("controller123", 10);
  const supervisorHash = await bcrypt.hash("supervisor123", 10);

  await User.create([
    {
      name: "Admin User",
      email: "admin@traincontrol.in",
      passwordHash: adminHash,
      role: "admin",
      isActive: true,
    },
    {
      name: "Train Operator",
      email: "operator@traincontrol.in",
      passwordHash: operatorHash,
      role: "controller",
      isActive: true,
    },
    {
      name: "Traffic Controller",
      email: "controller@traincontrol.in",
      passwordHash: controllerHash,
      role: "controller",
      isActive: true,
    },
    {
      name: "Station Supervisor",
      email: "supervisor@traincontrol.in",
      passwordHash: supervisorHash,
      role: "supervisor",
      isActive: true,
    },
  ]);
  console.log("✅ Created 4 user accounts\n");

  console.log("════════════════════════════════════════════════════════");
  console.log("✅ SEED COMPLETE - PRODUCTION DEMO DATA READY");
  console.log("════════════════════════════════════════════════════════\n");
  console.log("📊 Dataset Summary:");
  console.log(`   • Railway Sections: ${createdSections.length}`);
  console.log(`   • Active Trains: ${createdTrains.length}`);
  console.log(`   • AI Predictions: ${createdPredictions.length}`);
  console.log(`   • Analytics Records: ${createdAnalytics.length} days`);
  console.log(`   • User Accounts: 4\n`);

  console.log("🔐 Demo Credentials:");
  console.log("   Admin:       admin@traincontrol.in / admin123");
  console.log("   Operator:    operator@traincontrol.in / operator123");
  console.log("   Controller:  controller@traincontrol.in / controller123");
  console.log("   Supervisor:  supervisor@traincontrol.in / supervisor123\n");

  console.log("📊 Train Status Breakdown:");
  const onTime = createdTrains.filter(t => t.delay === 0).length;
  const delayed = createdTrains.filter(t => t.delay > 0).length;
  console.log(`   • On Time: ${onTime} trains`);
  console.log(`   • Delayed: ${delayed} trains`);
  console.log(`   • Avg Delay: ${(createdTrains.reduce((sum, t) => sum + (t.delay || 0), 0) / createdTrains.length).toFixed(1)} minutes\n`);

  console.log("🎯 Ready to present! Start your demo at http://localhost:5173");
  console.log("════════════════════════════════════════════════════════\n");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
