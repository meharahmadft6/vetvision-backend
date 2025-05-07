const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

// Admin Dashboard Statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts in parallel for better performance
    const [
      totalUsers,
      totalDoctors,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      rejectedAppointments,
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: "pending" }),
      Appointment.countDocuments({ status: "confirmed" }),
      Appointment.countDocuments({ status: "cancelled" }),
      Appointment.countDocuments({ status: "rejected" }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalAppointments,
        appointmentsByStatus: {
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          cancelled: cancelledAppointments,
          rejected: rejectedAppointments,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    // Step 1: Get all users with roles 'user' or 'doctor'
    const users = await User.find({ role: { $in: ["user", "doctor"] } }).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    // Step 2: Enhance doctor users with their profileImage
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        if (user.role === "doctor") {
          const doctorProfile = await Doctor.findOne({
            userId: user._id,
          }).select("profileImage");
          return {
            ...user.toObject(),
            profileImage: doctorProfile?.profileImage || null,
          };
        }
        return user;
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedUsers.length,
      data: enrichedUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};
// Get all doctors with user details
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate(
      "userId",
      "name email phone profileImage"
    );
    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message,
    });
  }
};

// Get all appointments with details
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "name email phone")
      .populate("doctor", "clinicName consultationFee")
      .populate("doctor.userId", "name email profileImage");

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Check if the user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Step 2: If the user is a doctor, check for an existing doctor profile
    if (user.role === "doctor") {
      const doctorProfile = await Doctor.findOne({ userId: user._id });
      if (doctorProfile) {
        return res.status(400).json({
          message:
            "Doctor profile exists. Delete the doctor profile before deleting the user.",
        });
      }
    }

    // Step 3: Delete the user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting user",
      error: error.message,
    });
  }
};
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Step 1: Check if the doctor profile exists
    const doctorProfile = await Doctor.findById(id);
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Step 2: Delete the associated user
    const user = await User.findById(doctorProfile.userId);
    if (user) {
      await User.findByIdAndDelete(user._id);
    }

    // Step 3: Delete the doctor profile
    await Doctor.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Doctor and associated user deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting doctor",
      error: error.message,
    });
  }
};
