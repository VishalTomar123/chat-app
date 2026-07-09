const express = require("express");
const router = express.Router();

const {
  register,
  login,
  logout
} = require("../controllers/authController");

const {
  registerValidation,
  loginValidation
  } = require("../middleware/validation");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post( "/logout", authMiddleware, logout );

module.exports = router;