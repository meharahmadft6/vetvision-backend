const express = require("express");
const router = express.Router();

const {
  createOrUpdateProfile,
  getProfile,
  getAllDoctors,
  getDoctorById,
} = require("../controllers/doctorController");

const authMiddleware = require("../middlewares/authMiddleware");
const uploadMiddleware = require("../middlewares/uploadMiddleware");

// POST /api/doctors/profile - Create or update doctor profile (Private)
router.post(
  "/profile",
  authMiddleware,
  uploadMiddleware.single("profileImage"),
  createOrUpdateProfile
);

// GET /api/doctors/profile - Get doctor profile (Private)
router.get("/profile", authMiddleware, getProfile);

// GET /api/doctors - Get all doctors (Public)
router.get("/", getAllDoctors);

// GET /api/doctors/:id - Get doctor by ID (Public)
router.get("/:id", getDoctorById);

module.exports = router;
