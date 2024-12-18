const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { updateUserProfile, getUserProfile, updateAddress } = require("../controllers/profileController");
// const { protect } = require("../middleware/authMiddleware");
const Stripe = require("stripe");
const stripe = Stripe(
  "sk_test_51HIjnmK18qLqQSoUDC116WJxtoA7R6R3TP679BonwJtxxX1RrAb4mwSJNoaCwqWYH7t8MJT9cQ5z7YKzY8y76ASa00fyLRBv1Y"
);
const { protect } = require("../middleware/authmiddleware");

const router = express.Router();

//update profile
//router.put("/profile", updateUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/profile", protect, getUserProfile);
router.put("/address", protect, updateAddress);
// Register a new user
router.post("/signup", async (req, res) => {
  const { Username, Email, password, ConfirmPassword } = req.body;

  // Validate input fields
  if (!Username || !Email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (password !== ConfirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const userExists = await User.findOne({ Email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const user = await User.create({ Username, Email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({ user, token });
  } catch (error) {
    // Log the exact error message for debugging
    console.error("Error during signup:", error);

    // Send a user-friendly error message
    res.status(500).json({
      message: "An error occurred during sign up, please try again later.",
    });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { Email, password } = req.body;

  // Validate input fields
  if (!Email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ Email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (user && (await user.matchPassword(password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      res.json({ user, token });
    } else {
      res.status(401).json({ message: "Invalid email or password." });
    }
  } catch (error) {
    // Log the exact error message for debugging
    console.error("Error during login:", error);

    // Send a user-friendly error message
    res.status(500).json({
      message: "An error occurred during login, please try again later.",
    });
  }
});

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { cartItems } = req.body;

    // Log received cartItems for debugging
    console.log("Received cartItems:", cartItems);

    // Validate cartItems
    if (
      !cartItems ||
      !Array.isArray(cartItems) ||
      !cartItems.every((item) => item.quantity && item.price && item.name)
    ) {
      return res.status(400).json({
        error: "Invalid cart items: each item must have a name, price, and quantity",
      });
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cartItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/success`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe checkout session error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/store-card", async (req, res) => {
  const { cardNumber, cardholderName, expiryDate, cvv } = req.body;

  try {
    // Simulating Stripe 3D Secure Integration
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardNumber,
        exp_month: expiryDate.split("/")[0],
        exp_year: expiryDate.split("/")[1],
        cvc: cvv,
      },
    });

    // Return a client-side redirect URL for 3D Secure verification
    res.json({
      success: true,
      redirectUrl: `https://3d-secure-example.com/verify?method=${paymentMethod.id}`,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
