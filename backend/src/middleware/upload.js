const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp"
];

const upload = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },

    fileFilter: (req, file, cb) => {

        const ext = path
            .extname(file.originalname)
            .toLowerCase();

        if (!allowedMimeTypes.includes(file.mimetype)) {

            return cb(
                new Error("Invalid file type.")
            );

        }

        if (!allowedExtensions.includes(ext)) {

            return cb(
                new Error("Invalid file extension.")
            );

        }

        cb(null, true);

    }

});

module.exports = upload;