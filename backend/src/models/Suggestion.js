const mongooseSug = require("mongoose");


const SuggestionSchema = new mongooseSug.Schema({
train: { type: mongooseSug.Schema.Types.ObjectId, ref: "Train" },
action: String,
params: Object,
confidence: Number
});
module.exports = mongooseSug.model("Suggestion", SuggestionSchema);