const express = require("express");
const {
  registerUser,
  loginUser,
  getAllUsers,
  getUserById,
  forgotPassword,
  resetPassword,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
