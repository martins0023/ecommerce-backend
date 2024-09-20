const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Replace with your secret key
const JWT_SECRET = process.env.JWT_SECRET || "yourSecretKey";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "30d", // Token will expire in 30 days
  });
};

// Fetch User Profile (GET /profile)
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // req.user._id is extracted from the JWT
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      Username: user.Username,
      Email: user.Email,
      profileImage: user.profileImage,
      gender: user.gender,
      birthday: user.birthday,
      address: user.address, // if the address is available
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Profile (PUT /profile)
exports.updateUserProfile = async (req, res) => {
  const { Username, Email, profileImage, gender, birthday } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.Username = Username || user.Username;
      user.Email = Email || user.Email;
      user.profileImage = profileImage || user.profileImage;
      user.gender = gender || user.gender;
      user.birthday = birthday || user.birthday;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        Username: updatedUser.Username,
        Email: updatedUser.Email,
        profileImage: updatedUser.profileImage,
        gender: updatedUser.gender,
        birthday: updatedUser.birthday,
        token: generateToken(updatedUser._id), // Using JWT for token generation
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Password (PUT /profile/update-password)
exports.updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user && (await bcrypt.compare(oldPassword, user.password))) {
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: "Password updated successfully" });
    } else {
      res.status(400).json({ message: "Incorrect current password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Email (PUT /profile/update-email)
exports.updateEmail = async (req, res) => {
  const { newEmail } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.Email = newEmail;
      await user.save();

      res.json({ message: "Email updated successfully", Email: user.Email });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Manage Addresses (PUT /profile/update-address)
exports.updateAddress = async (req, res) => {
  const { newAddress } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.address = newAddress || user.address;
      await user.save();

      res.json({ message: "Address updated successfully", address: user.address });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
