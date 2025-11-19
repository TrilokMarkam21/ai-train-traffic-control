const mongooseT = require("mongoose");


const TrainSchema = new mongooseT.Schema({
trainId: String,
name: String,
route: [String],
speedKmph: Number,
delayMin: Number,
currentSection: { type: mongooseT.Schema.Types.ObjectId, ref: "Section" }
});
module.exports = mongooseT.model("Train", TrainSchema);