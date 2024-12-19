const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Card = require("../models/Card"); // Import your Card model
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

//  Logout user
router.post("/logout", (req, res) => {
  try {
    // Clear the client's token or session cookie
    res.clearCookie("authToken"); // Replace with your token cookie name
    return res.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "An error occurred." });
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
  const { cardNumber, cardholderName, expiryDate, cvv, userId } = req.body;

  try {
    // Validate Input
    if (!cardNumber || !cardholderName || !expiryDate || !cvv || !userId) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    // Parse expiryDate
    const [expMonth, expYear] = expiryDate.split("/");
    if (!expMonth || !expYear || isNaN(expMonth) || isNaN(expYear)) {
      return res.status(400).json({ success: false, error: "Invalid expiry date format." });
    }

    // Create a Payment Method
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardNumber,
        exp_month: parseInt(expMonth),
        exp_year: parseInt(expYear),
        cvc: cvv,
      },
    });

    // Save Card Details in Database
    const newCard = new Card({
      userId,
      cardholderName,
      stripePaymentMethodId: paymentMethod.id,
    });

    await newCard.save();

    // Respond with Success
    res.json({ success: true, message: "Card saved successfully." });
  } catch (error) {
    console.error("Error Storing Card:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// router.post("/store-card", async (req, res) => {
//   const { cardNumber, cardholderName, expiryDate, cvv, userId } = req.body;

//   try {
//     // Validate Input
//     if (!cardNumber || !cardholderName || !expiryDate || !cvv || !userId) {
//       return res.status(400).json({ success: false, error: "All fields are required." });
//     }

//     // Split expiryDate and validate format
//     const [expMonth, expYear] = expiryDate.split("/");
//     if (!expMonth || !expYear || isNaN(expMonth) || isNaN(expYear)) {
//       return res.status(400).json({ success: false, error: "Invalid expiry date format." });
//     }

//     // Create a Payment Method
//     const paymentMethod = await stripe.paymentMethods.create({
//       type: "card",
//       card: {
//         number: cardNumber,
//         exp_month: parseInt(expMonth),
//         exp_year: parseInt(expYear),
//         cvc: cvv,
//       },
//     });

//     // Attach the Payment Method to the User's Customer in Stripe
//     const customer = await stripe.customers.create({
//       name: cardholderName,
//     });

//     await stripe.paymentMethods.attach(paymentMethod.id, {
//       customer: customer.id,
//     });

//     // Create a Setup Intent for 3D Secure Authentication
//     const setupIntent = await stripe.setupIntents.create({
//       customer: customer.id,
//       payment_method: paymentMethod.id,
//       confirm: true,
//       return_url: "http://localhost:5173/settings", // Redirect after verification
//     });

//     if (setupIntent.status === "requires_action") {
//       // Return the 3D Secure URL to the frontend
//       return res.json({
//         success: true,
//         redirectUrl: setupIntent.next_action.redirect_to_url.url,
//       });
//     }

//     // Save Card Details in Database
//     const newCard = new Card({
//       userId,
//       cardholderName,
//       stripePaymentMethodId: paymentMethod.id,
//     });

//     await newCard.save();

//     // Respond with Success
//     res.json({ success: true, message: "Card saved successfully." });
//   } catch (error) {
//     console.error("Stripe Error:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// });


router.get("/get-cards/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required." });
    }

    const cards = await Card.find({ userId });
    res.json({ success: true, cards });
  } catch (error) {
    console.error("Error Fetching Cards:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
