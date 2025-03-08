const mongoose = require("mongoose"); // Import mongoose to validate ObjectId
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Import User model
const jwt = require("jsonwebtoken");
const { log } = require("console");
// Configure Nodemailer with Free Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Use App Password (not regular password)
  },
});

// Forgot Password: Generate & Send 6-digit OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // Valid for 60 minutes
    await user.save();

    // Email Content
    const mailOptions = {
      from: `"TaLkZilla" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Reset Code - TaLkZilla",
      html: `
 <div style="max-width: 600px; margin: auto; font-family: 'Arial', sans-serif; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);">
  <!-- Header Section -->
  <h2 style="text-align: center; color: #1D4ED8; font-size: 36px; font-weight: 600; letter-spacing: 1px; margin-bottom: 25px; text-transform: capitalize;">
    Reset Your Password
  </h2>
  
  <!-- Greeting Section -->
  <p style="text-align: center; font-size: 18px; color: #4B5563;">
    Hello <b>${user.name}</b>, 👋
  </p>
  
  <!-- Instructions Section -->
  <p style="text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;">
    We received a request to reset your password. Use the OTP below to complete the process. This code will expire in <b>60 minutes</b>.
  </p>

  <!-- OTP Display Section -->
  <div style="display: flex; justify-content: center; align-items: center; font-size: 36px; font-weight: 700; color: #1D4ED8; padding: 20px 30px; border: 2px solid #1D4ED8; border-radius: 8px; letter-spacing: 4px; margin-bottom: 20px; background-color: #F3F4F6; width: fit-content; margin-left: auto; margin-right: auto;">
    ${otp}
  </div>

  <!-- Disclaimer Section -->
  <p style="text-align: center; font-size: 14px; color: #DC2626; margin-bottom: 20px;">
    ⚠️ If you didn’t request this, please ignore this email.
  </p>

  <!-- Support Section -->
  <p style="text-align: center; font-size: 14px; color: #6B7280;">
    Need assistance? <a href="mailto:support@talkzilla.com" style="color: #1D4ED8; text-decoration: none; font-weight: 500;">Contact Support</a>
  </p>

  <!-- Footer Section -->
  <p style="text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px;">
    This is an automated message. Please do not reply to this email.
  </p>
</div>


      `,
    };

    // Send Email
    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to email!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Reset Password: Verify OTP & Change Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
      console.log("Invalid");
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }, // Check if OTP is still valid
    });

    if (!user) {
      console.log("Invalid or expired OTP");
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined; // Clear reset token
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
1;
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, phone, password: hashedPassword });
    await newUser.save();

    // Welcome Email Content
    const mailOptions = {
      from: `"TaLkZilla" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to TaLkZilla!",
      html: `
        <div style="max-width: 600px; margin: auto; font-family: 'Arial', sans-serif; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);">
          <!-- Header Section -->
          <h2 style="text-align: center; color: #1D4ED8; font-size: 36px; font-weight: 600; letter-spacing: 1px; margin-bottom: 25px; text-transform: capitalize;">
            Welcome to TaLkZilla!
          </h2>
          
          <!-- Greeting Section -->
          <p style="text-align: center; font-size: 18px; color: #4B5563;">
            Hello <b>${name}</b>, 👋
          </p>
          
          <!-- Welcome Message Section -->
          <p style="text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;">
            We're thrilled to have you on board! Thank you for joining our community. Get ready to explore amazing features and connect with people around the world.
          </p>

          <!-- Call to Action Section -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://talkzilla.com" style="background-color: #1D4ED8; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500;">
              Start Exploring
            </a>
          </div>

          <!-- Support Section -->
          <p style="text-align: center; font-size: 14px; color: #6B7280;">
            Need assistance? <a href="mailto:support@talkzilla.com" style="color: #1D4ED8; text-decoration: none; font-weight: 500;">Contact Support</a>
          </p>

          <!-- Footer Section -->
          <p style="text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    // Send Welcome Email
    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, "-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Cloudinary returns the full URL automatically
    const imageUrl = req.file.path;

    // Update the user's profileImage with Cloudinary URL
    const user = await User.findByIdAndUpdate(
      user_id,
      { profileImage: imageUrl },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, image_url: imageUrl });
  } catch (error) {
    console.error("❌ Image upload failed:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
};

exports.getUserProfileImage = async (req, res) => {
  try {
    const { user_id } = req.params; // Get user_id from params

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ error: `Invalid user ID: ${user_id}` });
    }

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.profileImage) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    res.json({
      success: true,
      image_url: user.profileImage, // Cloudinary URL is stored directly
    });
  } catch (error) {
    console.error("❌ Error fetching user profile image:", error);
    res.status(500).json({ error: "Failed to fetch profile image" });
  }
};
