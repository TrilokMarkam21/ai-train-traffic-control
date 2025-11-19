const mongooseS = require("mongoose");


const SectionSchema = new mongooseS.Schema({
sectionId: String,
name: String,
startStation: String,
endStation: String,
lengthMeters: Number,
maxSpeedKmph: Number,
currentOccupancy: Number,
minHeadwaySec: Number
});
module.exports = mongooseS.model("Section", SectionSchema);