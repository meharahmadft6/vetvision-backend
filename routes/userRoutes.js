const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2; // Import Cloudinary
const path = require("path");

const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  verifyOTP,
  forgotPassword,
  resetPassword,
  uploadProfileImage,
  getUserProfileImage,
} = require("../controllers/userController");

const router = express.Router();

// 📌 Cloudinary Configuration (Make sure environment variables are set)
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUD_API_KEY, // Your Cloudinary API key
  api_secret: process.env.CLOUD_API_SECRET, // Your Cloudinary API secret
});

// 📌 Multer Storage Configuration for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "talkzilla_profiles", // All uploaded images will be stored in this folder
    format: async (req, file) => "png", // Ensure images are saved as PNG
    public_id: (req, file) => `profile_${Date.now()}`, // Unique image name
  },
});

// 📌 Multer Middleware
const upload = multer({ storage });

// 📌 Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-otp", verifyOTP);

// 📌 Profile Image Upload with Cloudinary
router.post("/upload", upload.single("image"), uploadProfileImage);
router.get("/get-profile-image/:user_id", getUserProfileImage);

module.exports = router;
