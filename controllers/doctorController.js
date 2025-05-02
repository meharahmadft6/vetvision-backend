const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

// Create or update doctor profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
    const profileData = req.body;
    console.log("Profile data:", profileData);
    console.log("User ID:", userId);
    // Validate required fields
    if (!profileData.degree || !profileData.licenseNumber) {
      return res.status(400).json({
        success: false,
        message: "Degree and license number are required",
      });
    }

    // Handle file upload
    let profileImage;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file);
        profileImage = uploadResult.url;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
          error: uploadError.message,
        });
      }
    }

    // Upsert doctor profile
    const doctor = await Doctor.findOneAndUpdate(
      { userId },
      { ...profileData, ...(profileImage && { profileImage }) },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile saved successfully",
      data: doctor,
    });
  } catch (error) {
    console.error("Profile save error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
// Get doctor profile
exports.getProfile = async (req, res) => {
  try {
    console.log("Fetching doctor profile for user ID:", req.params.userId);
    const { userId } = req.params;

    const doctor = await Doctor.findOne({ userId }).populate(
      "userId",
      "name email phone"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor profile",
      error: error.message,
    });
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors",
      error: error.message,
    });
  }
};
// Get doctor by ID
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "userId",
      "name email phone"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    console.error("Error fetching doctor by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor",
      error: error.message,
    });
  }
};
exports.updateProfileImage = async (req, res) => {
  try {
    const { userId } = req.user;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Upload image to Cloudinary
    let profileImage;
    try {
      const uploadResult = await uploadToCloudinary(req.file);
      profileImage = uploadResult.url;
    } catch (uploadError) {
      return res.status(500).json({
        success: false,
        message: "Image upload failed",
        error: uploadError.message,
      });
    }

    // Update only the profile image
    const updatedDoctor = await Doctor.findOneAndUpdate(
      { userId },
      { profileImage },
      { new: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: {
        profileImage: updatedDoctor.profileImage,
      },
    });
  } catch (error) {
    console.error("Profile image update error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
