const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cardholderName: { type: String, required: true },
  stripePaymentMethodId: { type: String, required: true },
  addedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Card", cardSchema);
