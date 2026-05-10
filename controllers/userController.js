const mongoose = require("mongoose"); // Import mongoose to validate ObjectId
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Import User model
const jwt = require("jsonwebtoken");
const { log } = require("console");
const UAParser = require("ua-parser-js");
const MobileDetect = require("mobile-detect");
// Configure Nodemailer with Free Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Use App Password (not regular password)
  },
});

// Forgot Password: Generate & Send 6-digit OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    console.log(`Generated OTP for ${email}: ${otp}`);
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // Valid for 60 minutes
    await user.save();

    // Email Content
    const mailOptions = {
      from: `"TaLkZilla" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Reset Code - TaLkZilla",
      html: `
 <div style="max-width: 600px; margin: auto; font-family: 'Arial', sans-serif; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);">
  <!-- Header Section -->
  <h2 style="text-align: center; color: #1D4ED8; font-size: 36px; font-weight: 600; letter-spacing: 1px; margin-bottom: 25px; text-transform: capitalize;">
    Reset Your Password
  </h2>
  
  <!-- Greeting Section -->
  <p style="text-align: center; font-size: 18px; color: #4B5563;">
    Hello <b>${user.name}</b>, 👋
  </p>
  
  <!-- Instructions Section -->
  <p style="text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;">
    We received a request to reset your password. Use the OTP below to complete the process. This code will expire in <b>60 minutes</b>.
  </p>

  <!-- OTP Display Section -->
  <div style="display: flex; justify-content: center; align-items: center; font-size: 36px; font-weight: 700; color: #1D4ED8; padding: 20px 30px; border: 2px solid #1D4ED8; border-radius: 8px; letter-spacing: 4px; margin-bottom: 20px; background-color: #F3F4F6; width: fit-content; margin-left: auto; margin-right: auto;">
    ${otp}
  </div>

  <!-- Disclaimer Section -->
  <p style="text-align: center; font-size: 14px; color: #DC2626; margin-bottom: 20px;">
    ⚠️ If you didn’t request this, please ignore this email.
  </p>

  <!-- Support Section -->
  <p style="text-align: center; font-size: 14px; color: #6B7280;">
    Need assistance? <a href="mailto:support@talkzilla.com" style="color: #1D4ED8; text-decoration: none; font-weight: 500;">Contact Support</a>
  </p>

  <!-- Footer Section -->
  <p style="text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px;">
    This is an automated message. Please do not reply to this email.
  </p>
</div>


      `,
    };

    // Send Email
    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to email!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Reset Password: Verify OTP & Change Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword) {
      console.log("Invalid");
      return res
        .status(400)
        .json({ message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() }, // Check if OTP is still valid
    });

    if (!user) {
      console.log("Invalid or expired OTP");
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined; // Clear reset token
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
1;
exports.registerUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    console.log(req.body);
    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["user", "doctor", "admin"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role.toLowerCase(),
    });
    await newUser.save();

    // Welcome Email Content
    const mailOptions = {
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to VetVision!",
      html: `
        <div style="max-width: 600px; margin: auto; font-family: 'Arial', sans-serif; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);">
          <!-- Header Section -->
          <h2 style="text-align: center; color: #1D4ED8; font-size: 36px; font-weight: 600; letter-spacing: 1px; margin-bottom: 25px; text-transform: capitalize;">
            Welcome to VetVision!
          </h2>
          
          <!-- Greeting Section -->
          <p style="text-align: center; font-size: 18px; color: #4B5563;">
            Hello <b>${name}</b>, 👋
          </p>
          
          <!-- Welcome Message Section -->
          <p style="text-align: center; font-size: 16px; color: #6B7280; margin-bottom: 30px;">
            We're thrilled to have you on board! Thank you for joining our veterinary community. Get ready to explore amazing features and ${
              role === "doctor"
                ? "provide excellent care to pets"
                : "take the best care of your pets"
            }.
          </p>

          <!-- Call to Action Section -->
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="https://vetvision.com" style="background-color: #1D4ED8; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 500;">
              Start Exploring
            </a>
          </div>

          <!-- Support Section -->
          <p style="text-align: center; font-size: 14px; color: #6B7280;">
            Need assistance? <a href="mailto:support@vetvision.com" style="color: #1D4ED8; text-decoration: none; font-weight: 500;">Contact Support</a>
          </p>

          <!-- Footer Section -->
          <p style="text-align: center; font-size: 12px; color: #9CA3AF; margin-top: 30px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    // Send Welcome Email
    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Please provide a valid email address",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "AUTH_ERROR",
        message: "Email not Found",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password does not match");
      return res.status(401).json({
        success: false,
        error: "AUTH_ERROR",
        message: "Invalid Password",
      });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Don't await - let it run in background
    if (user.role === "admin") {
      sendAdminLoginNotification(user, req).catch((err) =>
        console.error("Failed to send admin notification:", err),
      );
    }

    // Send response immediately
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An unexpected error occurred. Please try again later.",
    });
  }
};
// Helper function for email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password"); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id, "-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.uploadProfileImage = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // Cloudinary returns the full URL automatically
    const imageUrl = req.file.path;

    // Update the user's profileImage with Cloudinary URL
    const user = await User.findByIdAndUpdate(
      user_id,
      { profileImage: imageUrl },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, image_url: imageUrl });
  } catch (error) {
    console.error("❌ Image upload failed:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
};

exports.getUserProfileImage = async (req, res) => {
  try {
    const { user_id } = req.params;

    // ✅ Validate user_id
    if (!user_id) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // ✅ Find user
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Check if the user has a profile image
    if (!user.profileImage) {
      return res.status(404).json({ error: "Profile image not found" });
    }

    // ✅ Return Cloudinary image URL
    res.json({ success: true, image_url: user.profileImage });
  } catch (error) {
    console.error("❌ Error fetching profile image:", error);
    res.status(500).json({ error: "Failed to fetch profile image" });
  }
};

async function sendAdminLoginNotification(user, req) {
  try {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers["user-agent"] || "";

    // Enhanced device detection using both libraries
    const deviceInfo = getEnhancedDeviceInfo(userAgent);

    // Get location from IP
    let locationInfo = `IP: ${ipAddress}`;
    if (!isLocalIp(ipAddress)) {
      try {
        const geoData = await getIpGeolocation(ipAddress);
        locationInfo = formatLocationInfo(ipAddress, geoData);
      } catch (geoError) {
        console.error("Geolocation error:", geoError);
        locationInfo = `IP: ${ipAddress} (Geolocation failed)`;
      }
    }

    await transporter.sendMail({
      from: `"VetVision" <${process.env.EMAIL_USER}>`,
      to: "meharahmad.ft6@gmail.com",
      subject: "Admin Login Notification",
      html: generateLoginEmailHtml(user, deviceInfo, locationInfo),
    });
  } catch (error) {
    console.error("Error sending admin login notification email:", error);
  }
}

// Enhanced device detection combining both libraries
function getEnhancedDeviceInfo(userAgent) {
  // Parse with ua-parser-js
  const parser = new UAParser(userAgent);
  const uaResult = parser.getResult();

  // Parse with mobile-detect
  const md = new MobileDetect(userAgent);

  // Device type
  const deviceType = md.mobile()
    ? "mobile"
    : md.tablet()
      ? "tablet"
      : "desktop";

  // Device name construction
  let deviceName = "";
  if (deviceType !== "desktop") {
    // Try to get manufacturer and model from mobile-detect first
    const manufacturer = md.mobile() || md.tablet() || "Mobile";
    const model = md.userAgents.find((ua) => userAgent.includes(ua)) || "";

    deviceName = `${manufacturer} ${model}`.trim();

    // Fallback to ua-parser if no model found
    if (!model && (uaResult.device.vendor || uaResult.device.model)) {
      deviceName = `${uaResult.device.vendor || ""} ${
        uaResult.device.model || ""
      }`.trim();
    }

    // Final fallback
    if (!deviceName) {
      deviceName = deviceType === "tablet" ? "Tablet" : "Mobile Phone";
    }
  } else {
    deviceName = uaResult.os.name
      ? `${uaResult.os.name} ${uaResult.os.version || ""}`.trim()
      : "Desktop";
  }

  // Browser info
  const browserInfo = uaResult.browser.name
    ? `${uaResult.browser.name} ${uaResult.browser.version || ""}`.trim()
    : "Unknown Browser";

  // Platform info
  const platformInfo = [];
  if (uaResult.cpu.architecture) platformInfo.push(uaResult.cpu.architecture);
  if (uaResult.os.name && deviceType === "desktop")
    platformInfo.push(uaResult.os.name);

  // Mobile-specific additional info
  if (deviceType !== "desktop") {
    if (md.version("WebKit"))
      platformInfo.push(`WebKit ${md.version("WebKit")}`);
    if (md.versionStr("Build"))
      platformInfo.push(`Build ${md.versionStr("Build")}`);
    if (md.is("iPhone")) platformInfo.push("iPhone");
    if (md.is("Android"))
      platformInfo.push(`Android ${md.version("Android") || ""}`.trim());
  }

  return `
    ${deviceName} | 
    Browser: ${browserInfo} | 
    ${platformInfo.join(" ")}
  `
    .replace(/\s+/g, " ")
    .trim();
}

// Rest of the helper functions remain the same
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.ip ||
    req.connection?.remoteAddress ||
    "Unknown IP"
  );
}

function isLocalIp(ip) {
  return ip === "::1" || ip.startsWith("127.") || ip === "Unknown IP";
}

async function getIpGeolocation(ip) {
  const API_KEY = process.env.IPGEOLOCATION_API_KEY;
  const response = await fetch(
    `https://api.ipgeolocation.io/ipgeo?apiKey=${API_KEY}&ip=${ip}`,
  );
  if (!response.ok) throw new Error("Geolocation API failed");
  return await response.json();
}

function formatLocationInfo(ip, geoData) {
  return `
    IP: ${ip}
    Location: ${geoData.city || "Unknown city"}, ${
      geoData.state_prov || "Unknown region"
    }, ${geoData.country_name || "Unknown country"}
    Coordinates: ${geoData.latitude || "?"}, ${geoData.longitude || "?"}
    ISP: ${geoData.isp || "Unknown ISP"}
    Connection: ${geoData.connection_type || "Unknown"} (${
      geoData.organization || "Unknown org"
    })
  `;
}

function generateLoginEmailHtml(user, deviceInfo, locationInfo) {
  const options = {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const pakistanTime = new Date().toLocaleString("en-PK", options);

  return `
    <div style="${emailStyles.container}">
      <h2 style="${emailStyles.header}">Admin Login Detected</h2>
      <p style="${emailStyles.paragraph}">
        An admin user has logged into the system:
      </p>
      
      <div style="text-align: left; margin: 25px 0;">
        <p><strong>Admin Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Login Time:</strong> ${pakistanTime}</p>
        <p><strong>Device Info:</strong> ${deviceInfo}</p>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap;"><strong>Location Info:</strong>\n${locationInfo}</pre>
      </div>

      <p style="${emailStyles.footer}">
        This is an automated security notification. If you didn't perform this login, please take immediate action to secure your account.
      </p>
    </div>
  `;
} // Email styles (should be defined somewhere in your project)
const emailStyles = {
  container: `
    font-family: 'Arial', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background-color: #ffffff;
  `,
  header: `
    color: #111827;
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 20px;
  `,
  paragraph: `
    color: #4b5563;
    font-size: 16px;
    line-height: 1.5;
    text-align: center;
  `,
  button: `
    display: inline-block;
    padding: 12px 24px;
    background-color: #3b82f6;
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
  `,
  footer: `
    color: #6b7280;
    font-size: 14px;
    text-align: center;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
  `,
};
