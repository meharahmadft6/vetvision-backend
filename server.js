const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan"); // Import Morgan
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const path = require("path");
dotenv.config();
connectDB();
const cloudinary = require("cloudinary").v2;

// ... other middleware and routes

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const app = express();

// Increase payload size limit for image uploads
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Morgan for logging requests

// Test route
app.get("/", (req, res) => {
  res.send("Hello, your backend is live!");
});

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Doctor routes
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));

// Error handling middleware (should be after all routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Something went wrong!",
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
