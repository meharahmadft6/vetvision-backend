const express = require("express");
const router = express.Router();

const {
  createOrUpdateProfile,
  getProfile,
  getAllDoctors,
  getDoctorById,
  updateProfileImage,
  getDoctorsByLocation,
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

router.patch(
  "/profile/image",
  authMiddleware,
  uploadMiddleware.single("profileImage"),
  updateProfileImage
);

// GET /api/doctors/profile - Get doctor profile (Private)
router.get("/profile/:userId", getProfile);

// GET /api/doctors - Get all doctors (Public)
router.get("/", getAllDoctors);
router.post("/location", getDoctorsByLocation);

// GET /api/doctors/:id - Get doctor by ID (Public)
router.get("/:id", getDoctorById);

module.exports = router;
