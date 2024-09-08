const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { updateUserProfile } = require("../controllers/profileController");
//const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

//update profile
router.put("/profile", updateUserProfile);

// Register a new user
router.post("/signup", async (req, res) => {
  const { Username, Email, password, ConfirmPassword } = req.body;

  // Validate input fields
  if (!Username || !Email || !password || !ConfirmPassword) {
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
    res.status(500).json({ message: "An error occurred during sign up, please try again later." });
  }
});

// Login user
router.post("/login", async (req, res) => {
  const { Email, password } = req.body;

  // Validate input fields
  if (!Email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ Email });
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
    res.status(500).json({ message: "An error occurred during login, please try again later." });
  }
});

module.exports = router;
