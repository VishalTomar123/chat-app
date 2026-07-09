const winston = require("winston");
require("winston-daily-rotate-file");
const UAParser = require("ua-parser-js");

const transport = new winston.transports.DailyRotateFile({

    filename: "logs/%DATE%.log",

    datePattern: "YYYY-MM-DD",

    zippedArchive: true,

    maxSize: "20m",

    maxFiles: "30d"

});

const logger = winston.createLogger({

    level: "info",

    format: winston.format.combine(

        winston.format.timestamp({

            format: "YYYY-MM-DD HH:mm:ss"

        }),

        winston.format.printf(({ timestamp, level, message }) => {

            return `[${timestamp}] ${level.toUpperCase()} : ${message}`;

        })

    ),

    transports: [

        transport,

        new winston.transports.Console()

    ]

});

// Helper Function
logger.logRequest = (req, action, details = "") => {

    const parser = new UAParser(req.headers["user-agent"]);

    const browser = parser.getBrowser();

    const os = parser.getOS();

    const device = parser.getDevice();

    const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    req.ip;

    logger.info(

`${action} |
User=${req.user?.id || "Guest"} |
IP=${ip} |
Browser=${browser.name || "Unknown"} ${browser.version || ""} |
OS=${os.name || "Unknown"} ${os.version || ""} |
Device=${device.type || "Desktop"} |
${details}`

    );

};

module.exports = logger;