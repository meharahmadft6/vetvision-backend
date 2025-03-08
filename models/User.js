const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  password: String,
  profileImage: { type: String, default: "" }, // Store image URL
  resetPasswordToken: String, // Stores the 6-digit OTP
  resetPasswordExpires: Date, // Expiry time for OTP
});

module.exports = mongoose.model("User", userSchema);
