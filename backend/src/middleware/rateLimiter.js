const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 20,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many login attempts. Please try again later."
    }

});

const messageLimiter = rateLimit({

    windowMs: 60 * 1000,

    max: 80,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many messages. Slow down."
    }

});

const searchLimiter = rateLimit({

    windowMs: 60 * 1000,

    max: 100,

    standardHeaders: true,

    legacyHeaders: false,

    message: {
        success: false,
        message: "Too many searches."
    }

});

module.exports = {

    authLimiter,
    messageLimiter,
    searchLimiter

};