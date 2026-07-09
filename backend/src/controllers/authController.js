const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const logger = require("../utils/logger");
const generateChatId = async () => {

  while (true) {

      const chatId =
          "CHAT" +
          Math.floor(
              100000 + Math.random() * 900000
          );

      const [rows] = await db.query(
          "SELECT id FROM users WHERE chat_id=?",
          [chatId]
      );

      if (rows.length === 0) {
          return chatId;
      }

  }

};

// ========== Register Function ========

exports.register = async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    if (!username || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields required"
      });
    }

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE phone = ?",
      [phone]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Phone already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
  
  const chatId = await generateChatId();

    await db.query(
      "INSERT INTO users(username, phone, password, chat_id) VALUES (?, ?, ?, ?)",
      [username, phone, hashedPassword, chatId]
    );

    logger.logRequest( req, "REGISTER", `${phone} registered successfully`);

    res.status(201).json({
      success: true,
      message: "Registration successful"
    });

  } catch (error) {
    // console.error(error);
    logger.error( `${req.originalUrl} | ${error.stack}` );

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// ======= Login Function ==========

exports.login = async (req, res) => {
    try {
      const { phone, password } = req.body;
  
      const [userRows] = await db.query(
        "SELECT * FROM users WHERE phone = ?",
        [phone]
      );
  
      if (userRows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "User not found"
        });
      }
  
      const user = userRows[0];
  
      const isMatch = await bcrypt.compare(
        password,
        user.password
      );
  
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid password"
        });
      }
  
      const token = jwt.sign(
        {
          id: user.id,
          version: user.token_version
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );

      logger.logRequest( req, "LOGIN", `User ${user.id} (${user.username}) logged in`);
  
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          avatar:user.avatar,
          chat_id:user.chat_id
        }
      });
  
    } catch (error) {
      // console.error(error);
      logger.error( `${req.originalUrl} | ${error.stack}` );
  
      res.status(500).json({
        success: false,
        message: "Server Error"
      });
    }
  };

  exports.logout = async (req, res) => {

    try {

        await db.query(
            `
            UPDATE users
            SET token_version = token_version + 1
            WHERE id = ?
            `,
            [req.user.id]
        );

        logger.logRequest( req, "LOGOUT", `User ${req.user.id}`);

        res.json({
            success: true,
            message: "Logged out successfully"
        });

    } catch (err) {

        // console.log(err);
        logger.error( `${req.originalUrl} | ${err.stack}` );

        res.status(500).json({
            success: false,
            message: "Server Error"
        });

    }

};