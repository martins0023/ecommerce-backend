const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  cardholderName: { type: String },
  stripePaymentMethodId: { type: String },
  addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Card", cardSchema);