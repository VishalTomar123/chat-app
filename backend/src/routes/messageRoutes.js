const express = require("express");
const router = express.Router();
const upload =
require("../middleware/chatUpload");
const authMiddleware = require("../middleware/authMiddleware");
const {
  messageValidation
  } = require("../middleware/validation");
const {
  sendMessage,
  getMessages,
  markRead,
  uploadFile,
  deleteMessage,
  clearChat,
} = require("../controllers/messageController");

router.post("/send", authMiddleware, messageValidation, sendMessage);
router.get("/:sender/:receiver", authMiddleware, getMessages);
router.post("/mark-read", authMiddleware, markRead);
router.post(
  "/upload",
  authMiddleware,
  upload.single("file"),
  uploadFile
);
router.put(
  "/delete",
  authMiddleware,
  deleteMessage
);
router.post(
  "/clear-chat",
  authMiddleware,
  clearChat
);

module.exports = router;