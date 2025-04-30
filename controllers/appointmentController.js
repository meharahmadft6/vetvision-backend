const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const nodemailer = require("nodemailer");
// Book a new appointment
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, startTime, endTime, notes } = req.body;
    console.log("Booking appointment with data:", req.body);
    const patientId = req.params.id;
    console.log("Patient ID:", patientId);
    // Validate input
    if (!doctorId || !date || !startTime || !endTime) {
      console.error("Missing required fields:");
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Check for time slot availability
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Time slot already booked. Please choose another time.",
      });
    }

    // Create new appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date: new Date(date),
      startTime,
      endTime,
      fee: doctor.consultationFee,
      notes,
    });

    await appointment.save();

    // Populate doctor and patient details for response
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "name email")
      .populate({
        path: "doctor",
        select: " degree", // Fields from the doctor
        populate: {
          path: "userId", // User ID field in the doctor model
          select: "name email",
        },
      });
    // Send confirmation emails (async - don't await)
    sendAppointmentConfirmationEmails(populatedAppointment);

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get appointments for a patient
exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate("doctor", "name degree")
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAppointmentsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.id;

    const appointments = await Appointment.find({ patient: patientId })
      .populate("doctor", "name degree")
      .sort({ date: 1, startTime: 1 });

    if (!appointments.length) {
      return res.status(404).json({
        success: false,
        message: "No appointments found for this patient.",
      });
    }

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments by patient ID:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get appointments for a doctor
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate("patient", "name email")
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all appointments (admin)
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "name email")
      .populate("doctor", "name degree")
      .sort({ date: -1, startTime: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name email")
      .populate("doctor", "name specialization");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        patient: req.user.id,
        status: { $in: ["pending", "confirmed"] },
      },
      { status: "cancelled" },
      { new: true }
    ).populate("doctor", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be cancelled",
      });
    }

    // Send cancellation email (async)
    sendCancellationEmail(appointment, req.user);

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Confirm appointment (doctor)
exports.confirmAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor: req.user.id,
        status: "pending",
      },
      { status: "confirmed" },
      { new: true }
    ).populate("patient", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be confirmed",
      });
    }

    // Send confirmation email (async)
    sendConfirmationEmail(appointment, req.user);

    res.json({
      success: true,
      message: "Appointment confirmed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error confirming appointment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Complete appointment (doctor)
exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        doctor: req.user.id,
        status: "confirmed",
      },
      { status: "completed" },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or cannot be completed",
      });
    }

    res.json({
      success: true,
      message: "Appointment marked as completed",
      appointment,
    });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete appointment (admin)
exports.deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Helper function to send confirmation emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
});

// Email template styles
const emailStyles = {
  container:
    "max-width: 600px; margin: auto; font-family: 'Arial', sans-serif; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);",
  header:
    "text-align: center; color: #1D4ED8; font-size: 36px; font-weight: 600; letter-spacing: 1px; margin-bottom: 25px; text-transform: capitalize;",
  paragraph:
    "text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;",
  button:
    "background-color: #1D4ED8; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500;",
  footer:
    "text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px;",
};

async function sendAppointmentConfirmationEmails(appointment) {
  try {
    // Check if both patient and doctor emails are available
    if (!appointment.patient || !appointment.patient.email) {
      console.error("Patient email is missing");
      return;
    }
    console.log("Patient email:", appointment.patient.email);
    if (!appointment.doctor.userId.email || !appointment.doctor.userId.email) {
      console.error("Doctor email is missing");
      return;
    }
    console.log("Doctor  email:", appointment.doctor.userId.email);
    // Email to patient
    await transporter.sendMail({
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: appointment.patient.email,
      subject: "Appointment Booking Confirmation",
      html: `
          <div style="${emailStyles.container}">
            <h2 style="${emailStyles.header}">Appointment Booked</h2>
            <p style="${emailStyles.paragraph}">
              Hello <b>${
                appointment.patient.name
              }</b>, your appointment has been successfully booked!
            </p>
            <div style="text-align: left; margin: 25px 0;">
            <p><strong>Doctor:</strong> Dr. ${
              appointment.doctor.userId.name
            }</p>
                <p><strong>Specialization:</strong> ${
                  appointment.doctor.degree
                }</p>
              <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
              <p><strong>Time:</strong> ${appointment.startTime} - ${
        appointment.endTime
      }</p>
              <p><strong>Fee:</strong> $${appointment.fee}</p>
              <p><strong>Status:</strong> ${appointment.status}</p>
              ${
                appointment.notes
                  ? `<p><strong>Notes:</strong> ${appointment.notes}</p>`
                  : ""
              }
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://vetvision.com/appointments" style="${
                emailStyles.button
              }">
                View Appointment
              </a>
            </div>
            <p style="${emailStyles.footer}">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `,
    });

    // Email to doctor
    await transporter.sendMail({
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: appointment.doctor.userId.email,
      subject: "New Appointment Booking",
      html: `
          <div style="${emailStyles.container}">
            <h2 style="${emailStyles.header}">New Appointment</h2>
            <p style="${emailStyles.paragraph}">
              You have a new appointment booking:
            </p>
            <div style="text-align: left; margin: 25px 0;">
              <p><strong>Patient:</strong> ${appointment.patient.name}</p>
              <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
              <p><strong>Time:</strong> ${appointment.startTime} - ${
        appointment.endTime
      }</p>
              <p><strong>Fee:</strong> $${appointment.fee}</p>
              ${
                appointment.notes
                  ? `<p><strong>Patient Notes:</strong> ${appointment.notes}</p>`
                  : ""
              }
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://vetvision.com/doctor/appointments" style="${
                emailStyles.button
              }">
                View in Dashboard
              </a>
            </div>
            <p style="${emailStyles.footer}">
              This is an automated notification. Please log in to confirm or reschedule.
            </p>
          </div>
        `,
    });
  } catch (error) {
    console.error("Error sending confirmation emails:", error);
  }
}

async function sendCancellationEmail(appointment, patient) {
  try {
    await transporter.sendMail({
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: appointment.doctor.email,
      subject: "Appointment Cancellation Notification",
      html: `
          <div style="${emailStyles.container}">
            <h2 style="${emailStyles.header}">Appointment Cancelled</h2>
            <p style="${emailStyles.paragraph}">
              The following appointment has been cancelled:
            </p>
            
            <div style="text-align: left; margin: 25px 0;">
              <p><strong>Patient:</strong> ${patient.name}</p>
              <p><strong>Original Date:</strong> ${appointment.date.toDateString()}</p>
              <p><strong>Time Slot:</strong> ${appointment.startTime} - ${
        appointment.endTime
      }</p>
            </div>
  
            <p style="text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;">
              This time slot is now available for other patients.
            </p>
  
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://vetvision.com/doctor/schedule" style="${
                emailStyles.button
              }">
                Manage Schedule
              </a>
            </div>
  
            <p style="${emailStyles.footer}">
              This is an automated notification. No action is required unless you need to update your availability.
            </p>
          </div>
        `,
    });
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }
}

async function sendConfirmationEmail(appointment, doctor) {
  try {
    await transporter.sendMail({
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: appointment.patient.email,
      subject: "Appointment Confirmed",
      html: `
          <div style="${emailStyles.container}">
            <h2 style="${emailStyles.header}">Appointment Confirmed</h2>
            <p style="${emailStyles.paragraph}">
              Your appointment has been confirmed by the doctor.
            </p>
            
            <div style="text-align: left; margin: 25px 0;">
              <p><strong>Doctor:</strong> ${doctor.name}</p>
              <p><strong>Date:</strong> ${appointment.date.toDateString()}</p>
              <p><strong>Time:</strong> ${appointment.startTime} - ${
        appointment.endTime
      }</p>
              <p><strong>Location:</strong> VetVision Clinic or Virtual Meeting</p>
            </div>
  
            <p style="text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;">
              Please arrive 10 minutes before your scheduled time.
            </p>
  
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://vetvision.com/appointments" style="${
                emailStyles.button
              }">
                View Details
              </a>
            </div>
  
            <p style="${emailStyles.footer}">
              Need to reschedule? Please contact us at least 24 hours in advance.
            </p>
          </div>
        `,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
  }
}

// Example welcome email function
async function sendWelcomeEmail(email, name, role) {
  try {
    await transporter.sendMail({
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to VetVision!",
      html: `
          <div style="${emailStyles.container}">
            <h2 style="${emailStyles.header}">Welcome to VetVision!</h2>
            
            <p style="${emailStyles.paragraph}">
              Hello <b>${name}</b>, 👋<br>
              We're thrilled to have you on board! Thank you for joining our veterinary community.
            </p>
  
            <p style="${emailStyles.paragraph}">
              Get ready to explore amazing features and ${
                role === "doctor"
                  ? "provide excellent care to pets"
                  : "take the best care of your pets"
              }.
            </p>
  
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="https://vetvision.com" style="${emailStyles.button}">
                Start Exploring
              </a>
            </div>
  
            <p style="text-align: center; font-size: 14px; color: #6B7280;">
              Need assistance? <a href="mailto:support@vetvision.com" style="color: #1D4ED8; text-decoration: none; font-weight: 500;">Contact Support</a>
            </p>
  
            <p style="${emailStyles.footer}">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
}
