require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: { type: String, select: false },
  role: { type: String, default: "controller" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
userSchema.methods.verifyPassword = function (p) {
  return require("bcrypt").compare(p, this.passwordHash);
};
const User = mongoose.models.User || mongoose.model("User", userSchema);

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
const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);

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
const Train = mongoose.models.Train || mongoose.model("Train", trainSchema);

const sections = [
  {
    sectionId: "SEC-DEL-MTR",
    name: "Delhi-Mathura",
    startStation: "New Delhi",
    endStation: "Mathura",
    lengthMeters: 141000,
    maxSpeedKmph: 130,
    capacity: 2,
    currentOccupancy: 0,
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
    currentOccupancy: 0,
    status: "Clear",
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
    currentOccupancy: 0,
    status: "Clear",
    minHeadwaySec: 180,
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
    sectionId: "SEC-BCT-RTM",
    name: "Mumbai-Ratlam",
    startStation: "Mumbai Central",
    endStation: "Ratlam",
    lengthMeters: 497000,
    maxSpeedKmph: 130,
    capacity: 2,
    currentOccupancy: 0,
    status: "Clear",
    minHeadwaySec: 180,
  },
];

const trains = [
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
    speedKmph: 110,
  },
  {
    trainNumber: "12301",
    trainName: "Howrah Rajdhani Express",
    source: "Howrah",
    destination: "New Delhi",
    departureTime: "14:50",
    arrivalTime: "08:25",
    status: "Delayed",
    priority: 1,
    delay: 18,
    latitude: 22.5726,
    longitude: 88.3639,
    speedKmph: 95,
  },
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
    status: "On Time",
    priority: 2,
    delay: 5,
    latitude: 23.0225,
    longitude: 72.5714,
    speedKmph: 85,
  },
  {
    trainNumber: "12591",
    trainName: "Gorakhpur Express",
    source: "Gwalior",
    destination: "Bengaluru",
    departureTime: "06:15",
    arrivalTime: "06:05",
    status: "Delayed",
    priority: 3,
    delay: 32,
    latitude: 26.2124,
    longitude: 78.1772,
    speedKmph: 70,
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
    latitude: 18.5204,
    longitude: 73.8567,
    speedKmph: 90,
  },
];

async function seed() {
  const MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/ai_train_traffic";

  console.log("Connecting to MongoDB...");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Make sure MongoDB is running!");
    process.exit(1);
  }

  await Promise.all([
    User.deleteMany({}),
    Train.deleteMany({}),
    Section.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  const createdSections = await Section.insertMany(sections);
  console.log("Created " + createdSections.length + " sections");

  const trainsWithSections = trains.map((train, i) => ({
    ...train,
    currentSection: createdSections[i % createdSections.length]._id,
  }));
  const createdTrains = await Train.insertMany(trainsWithSections);
  console.log("Created " + createdTrains.length + " trains");

  const adminHash = await bcrypt.hash("admin123", 10);
  await User.create({
    name: "Admin User",
    email: "admin@traincontrol.in",
    passwordHash: adminHash,
    role: "admin",
  });
  console.log("Created admin user");

  const opHash = await bcrypt.hash("operator123", 10);
  await User.create({
    name: "Train Operator",
    email: "operator@traincontrol.in",
    passwordHash: opHash,
    role: "controller",
  });
  console.log("Created operator user");

  console.log("\n=== SEED COMPLETE ===");
  console.log("Admin:    admin@traincontrol.in    / admin123");
  console.log("Operator: operator@traincontrol.in / operator123");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});