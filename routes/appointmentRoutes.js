const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const authMiddleware = require("../middlewares/authMiddleware");

// Patient routes
router.post("/:id", appointmentController.bookAppointment);
router.get("/patient/:id", appointmentController.getAppointmentsByPatientId);

router.put("/:id/cancel", appointmentController.cancelAppointment);
router.put("/:id/reject", appointmentController.rejectAppointment);
router.put("/:id/confirm", appointmentController.confirmAppointment);

// Doctor routes
router.get("/doctor/:id", appointmentController.getDoctorAppointments);
router.put("/:id/confirm", appointmentController.confirmAppointment);
router.put(
  "/:id/complete",
  authMiddleware,
  appointmentController.completeAppointment
);

// Admin routes
router.get("/admin", appointmentController.getAllAppointments);
router.get("/:id", appointmentController.getAppointmentById);
router.delete("/:id", appointmentController.deleteAppointment);

module.exports = router;
