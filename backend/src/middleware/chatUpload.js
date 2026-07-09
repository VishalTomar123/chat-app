const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4",
    "audio/mpeg"
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".pdf",
    ".txt",
    ".mp4",
    ".mp3",
    ".csv",
    ".xls",
    ".doc",
    ".ppt",
    ".pptx",
    ".docs",
    ".xlsx"
];

const storage = multer.diskStorage({

    destination(req, file, cb) {

        cb(null, "uploads");

    },

    filename(req, file, cb) {

        const uniqueName =
            crypto.randomUUID() +
            path.extname(file.originalname).toLowerCase();

        cb(null, uniqueName);

    }

});

const upload = multer({

    storage,

    limits: {

        fileSize:  10 * 1024 * 1024 // 5MB

    },

    fileFilter(req, file, cb) {

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