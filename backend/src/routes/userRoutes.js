// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../middleware/authMiddleware");

// const {
//     getProfile
// } = require("../controllers/userController");

// router.get(
//     "/profile",
//     authMiddleware,
//     getProfile
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const {
  searchLimiter
} = require("../middleware/rateLimiter");
const {
  profileValidation
  } = require("../middleware/validation");
const {
  getUsers,
  getProfile,
  updateProfile,
  uploadAvatar,
  searchUser,
} = require("../controllers/userController");

router.get("/",authMiddleware, getUsers);


// Profile APIs
router.get("/profile", authMiddleware, getProfile);
router.get("/search", authMiddleware, searchLimiter, searchUser);
router.put("/profile", authMiddleware, profileValidation, updateProfile);
router.post(
  "/upload-avatar",
  authMiddleware,
  upload.single("avatar"),
  uploadAvatar
);

module.exports = router;