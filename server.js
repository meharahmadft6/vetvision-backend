const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan"); // Import Morgan
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const path = require("path");
dotenv.config();
connectDB();

// Serve static files from the uploads directory
const app = express();
app.use(bodyParser.json({ limit: "10mb" })); // Increase JSON request size limit
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Morgan for logging requests

// Routes
app.use("/api/users", require("./routes/userRoutes"));
const chatbotRoutes = require("./routes/chatbotRoutes");
app.use("/api/chatbot", chatbotRoutes);
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
