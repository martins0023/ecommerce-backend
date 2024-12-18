const stripe = require("stripe")(process.env.STRIPE_PUBLIC_SECRET_KEY);

module.exports = stripe;
