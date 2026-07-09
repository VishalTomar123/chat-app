const db = require("../config/db");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const logger = require("../utils/logger");

const getUsers = async (req, res) => {
  try {
    // const { userId } = req.query;
    const userId  = req.user.id;

    const [users] = await db.query(
      `SELECT u.*,
      (
        SELECT COUNT(*)
        FROM messages m
        WHERE m.sender_id = u.id
        AND m.receiver_id = ?
        AND m.is_read = 0
      ) AS unread

FROM users u
JOIN connections c
ON
(
c.sender_id=u.id
OR
c.receiver_id=u.id
)
WHERE
(
(c.sender_id=? AND c.receiver_id=u.id)
OR
(c.receiver_id=? AND c.sender_id=u.id)
)
AND c.status='ACCEPTED'
      `,
      [userId, userId, userId]
    );

    res.json(users);

  } catch (error) {
    logger.error( `${req.originalUrl} | ${error.stack}` 
);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const id  = req.user.id;

    const [rows] = await db.query(
      `
      SELECT
        id,
        chat_id,
        username,
        phone,
        avatar,
        about
      FROM users
      WHERE id = ?
      `,
      [id]
    );

    res.json(rows[0]);

  } catch (error) {
    logger.error( `${req.originalUrl} | ${error.stack}` 
);
    res.status(500).json({
      message: "Server Error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const id =req.user.id;
    const {
      username,
      about,
    } = req.body;

    await db.query(
      `
      UPDATE users
      SET
        username = ?,
        about = ?
      WHERE id = ?
      `,
      [
        username,
        about,
        id,
      ]
    );
    logger.logRequest( req, "PROFILE", `User ${id} updated profile`);

    res.json({
      success: true,
    });

  } catch (error) {
    logger.error( `${req.originalUrl} | ${error.stack}` 
);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
const uploadAvatar = async (req, res) => {
  try {

    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image selected",
      });
    }

    // Upload buffer to Cloudinary
    const uploadFromBuffer = () => {
      return new Promise((resolve, reject) => {

        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "chat-app/avatars",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        streamifier
          .createReadStream(req.file.buffer)
          .pipe(uploadStream);

      });
    };

    const result = await uploadFromBuffer();

    // Save URL into MySQL
    await db.query(
      `
      UPDATE users
      SET avatar = ?
      WHERE id = ?
      `,
      [
        result.secure_url,
        userId,
      ]
    );

    logger.logRequest( req, "AVATAR", `User ${userId} changed avatar`);
      
    res.json({
      success: true,
      avatar: result.secure_url,
    });

  } catch (error) {
    logger.error( `${req.originalUrl} | ${error.stack}` 
);

    res.status(500).json({
      success: false,
      message: "Upload Failed",
    });
  }
};

const searchUser = async (req, res) => {

  try {

      const { chatId } = req.query;
      const  userId  = req.user.id;

      // const [users] = await db.query(
      //     `
      //     SELECT
      //         id,
      //         username,
      //         avatar,
      //         chat_id
      //     FROM users
      //     WHERE chat_id = ?
      //     AND id != ?
      //     LIMIT 1
      //     `,
      //     [chatId, userId]
      // );
      const [users] = await db.query(
        `
        SELECT
        
        u.id,
        u.username,
        u.avatar,
        u.chat_id,
        
        c.id AS connection_id,
        c.status,
        
        c.sender_id,
        c.receiver_id
        
        FROM users u
        
        LEFT JOIN connections c
        
        ON
        (
        (c.sender_id=? AND c.receiver_id=u.id)
        
        OR
        
        (c.receiver_id=? AND c.sender_id=u.id)
        )
        
        WHERE
        
        (u.chat_id=?
        or
        u.phone=?
        )
        AND u.id!=?
        
        LIMIT 1
        `,
        [
        userId,
        userId,
        chatId,
        chatId,
        userId
        ]
      );

      if (users.length === 0) {

          return res.json(null);

      }

      res.json(users[0]);

  } catch (err) {

      logger.error( `${req.originalUrl} | ${err.stack}` 
);

      res.status(500).json({
          message: "Server Error"
      });

  }

};

module.exports = {
  getUsers,
  getProfile,
  updateProfile,
  uploadAvatar,
  searchUser,
};