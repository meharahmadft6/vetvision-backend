const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllUsers,
  getAllDoctors,
  getAllAppointments,
  deleteUser,
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");

// Apply authentication middleware to all admin routes
router.use(authMiddleware);

// Verify admin role for all admin routes
router.use((req, res, next) => {
  console.log("User role:", req.user.role); // Log the user role for debugging
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin privileges required.",
    });
  }
  next();
});

// GET /api/admin/dashboard - Get dashboard statistics (Admin only)
router.get("/dashboard", getDashboardStats);

// GET /api/admin/users - Get all users (Admin only)
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// GET /api/admin/doctors - Get all doctors with details (Admin only)
router.get("/doctors", getAllDoctors);

// GET /api/admin/appointments - Get all appointments (Admin only)
router.get("/appointments", getAllAppointments);

module.exports = router;
