const User = require("../models/User");

// Update User Profile
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
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
