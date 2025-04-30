const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const authMiddleware = require("../middlewares/authMiddleware");

// Patient routes
router.post("/:id", appointmentController.bookAppointment);
router.get(
  "/patient",
  authMiddleware,
  appointmentController.getPatientAppointments
);
router.put(
  "/:id/cancel",
  authMiddleware,
  appointmentController.cancelAppointment
);

// Doctor routes
router.get(
  "/doctor",
  authMiddleware,
  appointmentController.getDoctorAppointments
);
router.put(
  "/:id/confirm",
  authMiddleware,
  appointmentController.confirmAppointment
);
router.put(
  "/:id/complete",
  authMiddleware,
  appointmentController.completeAppointment
);

// Admin routes
router.get("/", authMiddleware, appointmentController.getAllAppointments);
router.get("/:id", authMiddleware, appointmentController.getAppointmentById);
router.delete("/:id", authMiddleware, appointmentController.deleteAppointment);

module.exports = router;
