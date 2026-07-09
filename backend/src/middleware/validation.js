const { body, validationResult } = require("express-validator");

const validate = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {

        return res.status(400).json({
            success: false,
            errors: errors.array()
        });

    }

    next();

};

// Register

const registerValidation = [

    body("username")
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3-30 characters"),

    body("phone")
        .trim()
        .isMobilePhone()
        .withMessage("Invalid phone number"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password minimum 6 characters"),

    validate

];

// Login

const loginValidation = [

    body("phone")
        .trim()
        .isMobilePhone(),

    body("password")
        .notEmpty(),

    validate

];

// Send Message

const messageValidation = [

    body("receiver_id")
        .isInt(),

    body("message")
        .trim()
        .isLength({
            min:1,
            max:3000
        }),

    validate

];

// Update Profile

const profileValidation = [

    body("username")
        .trim()
        .isLength({
            min:3,
            max:30
        }),

    body("about")
        .trim()
        .isLength({
            max:250
        }),

    validate

];

module.exports = {

    registerValidation,

    loginValidation,

    messageValidation,

    profileValidation

};