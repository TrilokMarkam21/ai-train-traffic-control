const mongooseTSR = require("mongoose");


const TSRschema = new mongooseTSR.Schema({
section: { type: mongooseTSR.Schema.Types.ObjectId, ref: "Section" },
speedLimitKmph: Number,
startTime: Date,
endTime: Date,
reason: String
});
module.exports = mongooseTSR.model("TSR", TSRschema);