const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/cloudinary");

// Create or update doctor profile
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const profileData = req.body;
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
exports.getDoctorsByLocation = async (req, res) => {
  try {
    const { location } = req.body;
    console.log("Location parameter:", location);

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Location parameter is required",
      });
    }

    // Normalize the input (remove extra spaces, handle case sensitivity)
    const normalizedLocation = location.trim().toLowerCase();
    const locationParts = normalizedLocation.split(/\s*,\s*/);
    const city = locationParts[0];
    const country =
      locationParts.length > 1 ? locationParts[locationParts.length - 1] : null;

    // Create search conditions
    const searchConditions = [];

    // Map common city names to their Urdu equivalents
    const cityMappings = {
      lahore: "لاہور",
      karachi: "کراچی",
      islamabad: "اسلام آباد",
      multan: "ملتان",
      peshawar: "پشاور",
    };

    // Always search for city name (English and Urdu) regardless of whether country is specified
    if (cityMappings[city]) {
      // English city name
      searchConditions.push({
        clinicAddress: {
          $regex: new RegExp(city, "i"),
        },
      });

      // Urdu city name
      searchConditions.push({
        clinicAddress: {
          $regex: new RegExp(cityMappings[city], "i"),
        },
      });
    } else {
      // For cities not in our mapping, just search for the provided name
      searchConditions.push({
        clinicAddress: {
          $regex: new RegExp(city, "i"),
        },
      });
    }

    // If country is specified, add country-specific conditions
    if (country) {
      // Add conditions that require both city and country
      if (cityMappings[city]) {
        // English city + country
        searchConditions.push({
          clinicAddress: {
            $regex: new RegExp(`${city}.*${country}|${country}.*${city}`, "i"),
          },
        });

        // Urdu city + country
        searchConditions.push({
          clinicAddress: {
            $regex: new RegExp(
              `${cityMappings[city]}.*${country}|${country}.*${cityMappings[city]}`,
              "i"
            ),
          },
        });
      } else {
        // For unmapped cities, just use the provided names
        searchConditions.push({
          clinicAddress: {
            $regex: new RegExp(`${city}.*${country}|${country}.*${city}`, "i"),
          },
        });
      }
    }

    // Search for doctors matching any of the conditions
    const doctors = await Doctor.find({
      $or: searchConditions,
    })
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors,
    });
  } catch (error) {
    console.error("Error fetching doctors by location:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctors by location",
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
