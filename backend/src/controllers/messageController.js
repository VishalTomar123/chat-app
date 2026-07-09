const db = require("../config/db");
const checkConnection = require("../utils/checkConnection");
const logger = require("../utils/logger");

const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const {
      receiver_id,
      message,
      reply_to,
    } = req.body;
    
    const connected = await checkConnection(
      sender_id,
      receiver_id
  );
  
  if (!connected) {
  
      return res.status(403).json({
          success: false,
          message: "You are not connected with this user."
      });
  
  }
    const [result] = await db.query(
      `INSERT INTO messages
      (
      sender_id,
      receiver_id,
      message,
      reply_to,
      status
      )
      VALUES
      (
      ?,?,?,?, 'SENT'
      )`,
      [sender_id, receiver_id, message, reply_to || null]
    );

    const [rows] = await db.query(
      `
      SELECT
      
      m.*,
      
      r.message AS reply_message,
      
      r.file AS reply_file,
      
      r.sender_id AS reply_sender
      
      FROM messages m
      
      LEFT JOIN messages r
      
      ON m.reply_to = r.id
      
      WHERE m.id=?
      `,
      [result.insertId]
      );
      logger.logRequest( req, "MESSAGE", `${sender_id} -> ${receiver_id}`);

      const newMessage = rows[0];

    const receiverSocket = global.onlineUsers[receiver_id];
const senderSocket = global.onlineUsers[sender_id];

if (receiverSocket) {

    global.io.to(receiverSocket).emit(
        "receiveMessage",
        newMessage
    );

    global.io.to(receiverSocket).emit(
        "newUnread",
        {
            sender_id,
        }
    );

}

if (senderSocket) {

    global.io.to(senderSocket).emit(
        "messageSent",
        newMessage
    );

}

    // res.json({
    //   success: true,
    //   messageId: result.insertId
    // });
    res.json(newMessage);
  } catch (error) {
    // console.log(error);
logger.error( `${req.originalUrl} | ${error.stack}` );
  }
};

const getMessages = async (req, res) => {
  try {
    const sender = req.user.id;
    const { receiver } = req.params;
    const connected = await checkConnection(
      sender,
      receiver
  );
  
  if (!connected) {
  
      return res.status(403).json({
          success: false,
          message: "Unauthorized"
      });
  
  }
    
    await db.query(
      `
      UPDATE messages
      SET status='DELIVERED'
      WHERE sender_id=?
      AND receiver_id=?
      AND status='SENT'
      `,
      [receiver, sender]
    );

    const [messages] = await db.query(
      `
      SELECT

m.*,

r.message AS reply_message,

r.file AS reply_file,

r.sender_id AS reply_sender

FROM messages m

LEFT JOIN messages r

ON m.reply_to=r.id

WHERE
(
    (m.sender_id=? AND m.receiver_id=?)
    OR
    (m.sender_id=? AND m.receiver_id=?)
)
AND
(
    (m.sender_id=? AND m.deleted_for_sender=0)
    OR
    (m.receiver_id=? AND m.deleted_for_receiver=0)
)
ORDER BY m.created_at ASC
      `,
      [sender, receiver, receiver, sender, sender, sender]
    );

    
    res.json(messages);

  } catch (error) {
    // console.log(error);
logger.error( `${req.originalUrl} | ${error.stack}` );
  }
};

const markRead = async (req, res) => {

  try {
    const receiver_id = req.user.id;
    const {
      sender_id
    } = req.body;
    // console.log('mark '+sender_id+ " " +receiver_id);
    await db.query(
      `
      UPDATE messages
      SET is_read = 1,
      status='SEEN'
      WHERE sender_id = ?
      AND receiver_id = ?
      `,
      [sender_id, receiver_id]
    );
    
    const senderSocket =
global.onlineUsers[sender_id];

if (senderSocket) {

  global.io.to(senderSocket).emit(
    "messageSeen",
    {
      sender_id,
      receiver_id
    }
  );

}

    res.json({
      success: true
    });

  } catch (error) {
    // console.log(error);
logger.error( `${req.originalUrl} | ${error.stack}` );
  }
};

const uploadFile = async (req, res) => {
  try {
    const sender_id = req.user.id;
    const {
      receiver_id,
    } = req.body;
    const connected = await checkConnection(
      sender_id,
      receiver_id
  );
  
  if (!connected) {
  
      return res.status(403).json({
          success: false,
          message: "You are not connected with this user."
      });
  
  }
    if (!req.file) {

      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });

    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const fileType = req.file.mimetype;

    const [result] = await db.query(
      `
      INSERT INTO messages
      (
        sender_id,
        receiver_id,
        file,
        file_name,
        file_type,
        status
      )
      VALUES
      (?,?,?,?,?,'SENT')
      `,
      [
        sender_id,
        receiver_id,
        fileUrl,
        req.file.originalname,
        fileType,
      ]
    );

    const [message] = await db.query(
      `
      SELECT *
      FROM messages
      WHERE id=?
      `,
      [result.insertId]
    );

    // Live send using socket
    const receiverSocket =
      global.onlineUsers[receiver_id];

    if (receiverSocket) {

      global.io
        .to(receiverSocket)
        .emit(
          "receiveMessage",
          message[0]
        );

    }
    logger.logRequest( req, "UPLOAD", `User ${sender_id} uploaded ${req.file.originalname}`);

    res.json(message[0]);

  } catch (err) {

    // console.log(err);
logger.error( `${req.originalUrl} | ${err.stack}` );

    res.status(500).json({
      success: false,
      message: "Upload Failed",
    });

  }
};
const deleteMessage = async (req, res) => {
  // console.log(req.user);
  try {
      const userId = req.user.id;
      const { messageId, type } = req.body;

      if (type === "everyone") {


          await db.query(

              `
              UPDATE messages
              SET
              deleted_for_everyone=1,
              message='This message was deleted.'
              WHERE id=?
              `,

              [messageId]

          );

          const [rows] = await db.query(

              "SELECT sender_id,receiver_id FROM messages WHERE id=?",

              [messageId]

          );

          if (rows.length) {

              const senderSocket =
                  global.onlineUsers[
                      rows[0].sender_id
                  ];

              const receiverSocket =
                  global.onlineUsers[
                      rows[0].receiver_id
                  ];

              if (senderSocket) {

                  global.io.to(senderSocket).emit(
                      "messageDeleted",
                      {
                          messageId,
                          type: "everyone",
                      }
                  );

              }

              if (receiverSocket) {

                  global.io.to(receiverSocket).emit(
                      "messageDeleted",
                      {
                          messageId,
                          type: "everyone",
                      }
                  );

              }

          }

      }

      else {

          const [rows] = await db.query(

              "SELECT sender_id,receiver_id FROM messages WHERE id=?",

              [messageId]

          );

          if (!rows.length)
              return res.sendStatus(404);

          const message = rows[0];

          if (
              Number(userId) ===
              Number(message.sender_id)
          ) {

              await db.query(

                  `
                  UPDATE messages
                  SET deleted_for_sender=1
                  WHERE id=?
                  `,

                  [messageId]

              );

          }

          else {

              await db.query(

                  `
                  UPDATE messages
                  SET deleted_for_receiver=1
                  WHERE id=?
                  `,

                  [messageId]

              );

          }

      }
      logger.logRequest( req, "DELETE", `User ${userId} deleted message ${messageId}`);

      res.json({

          success: true,

      });

  }

  catch (err) {

      // console.log(err);
      logger.error( `${req.originalUrl} | ${err.stack}` );

  }

};

const clearChat = async (req, res) => {

  try {
      const userId = req.user.id;
      const { friendId } = req.body;
      const connected = await checkConnection(
        userId,
        friendId
    );
    
    if (!connected) {
    
        return res.status(403).json({
            success: false,
            message: "Unauthorized"
        });
    
    }

      // Messages sent by current user
      await db.query(
          `
          UPDATE messages
          SET deleted_for_sender = 1
          WHERE sender_id = ?
          AND receiver_id = ?
          `,
          [userId, friendId]
      );

      // Messages received by current user
      await db.query(
          `
          UPDATE messages
          SET deleted_for_receiver = 1
          WHERE sender_id = ?
          AND receiver_id = ?
          `,
          [friendId, userId]
      );
      logger.logRequest( req, "CLEAR CHAT", `${userId} cleared chat with ${friendId}`);

      res.json({
          success: true
      });

  } catch (err) {

      // console.log(err);
logger.error( `${req.originalUrl} | ${err.stack}` );

      res.status(500).json({
          success: false
      });

  }

};

module.exports = {
  sendMessage,
  getMessages,
  markRead,
  uploadFile,
  deleteMessage,
  clearChat,
};

