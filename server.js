const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan"); // Import Morgan
const connectDB = require("./config/db");

dotenv.config();
connectDB();


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // Morgan for logging requests

// Routes
app.use("/api/users", require("./routes/userRoutes"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
