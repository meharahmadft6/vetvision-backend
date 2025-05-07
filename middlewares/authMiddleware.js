const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    console.log("No token provided in request headers");
    return res.status(401).json({ message: "Unauthorized, no token" });
  }

  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    // Fetch the complete user document from database
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log("User not found:", decoded.userId);
      return res.status(401).json({ message: "User not found" });
    }

    // Attach full user document including role
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
