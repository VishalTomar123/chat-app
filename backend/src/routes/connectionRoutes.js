const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const {

    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    removeConnection

} = require("../controllers/connectionController");

router.post( "/send", authMiddleware, sendRequest );
router.get( "/requests/:userId", authMiddleware, getRequests );
router.post( "/accept", authMiddleware, acceptRequest );
router.post( "/reject", authMiddleware, rejectRequest );
router.post( "/remove", authMiddleware, removeConnection );

module.exports = router;