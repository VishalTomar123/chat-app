const db = require("../config/db");
const logger = require("../utils/logger");
const sendRequest = async (req, res) => {

    try {
        const sender_id = req.user.id;
        const { receiver_id } = req.body;

        if (sender_id == receiver_id) {

            return res.status(400).json({
                message: "You cannot connect yourself."
            });

        }

        const [exist] = await db.query(

            `
            SELECT *
            FROM connections
            WHERE
            (sender_id=? AND receiver_id=?)
            OR
            (sender_id=? AND receiver_id=?)
            `,
            [
                sender_id,
                receiver_id,
                receiver_id,
                sender_id
            ]

        );

        // if (exist.length > 0) {

        //     return res.json({
        //         success: false,
        //         message: "Already requested."
        //     });

        // }
        if (exist.length > 0) {

            if (exist[0].status === "REJECTED") {
        
                await db.query(
                    `
                    UPDATE connections
                    SET
                        sender_id=?,
                        receiver_id=?,
                        status='PENDING',
                        created_at=NOW()
                    WHERE id=?
                    `,
                    [
                        sender_id,
                        receiver_id,
                        exist[0].id
                    ]
                );
        
                return res.json({
                    success: true,
                    resent: true
                });
            }
        
            return res.json({
                success: false,
                message: "Already requested."
            });
        
        }

        await db.query(

            `
            INSERT INTO connections
            (
                sender_id,
                receiver_id
            )
            VALUES
            (?,?)
            `,
            [
                sender_id,
                receiver_id
            ]

        );
        // Live Socket

        const receiverSocket =
            global.onlineUsers[receiver_id];

        if (receiverSocket) {

            global.io.to(receiverSocket).emit(

                "newConnectionRequest",

                {
                    sender_id
                }

            );

        }
        
        logger.logRequest( req, "REQUEST", `${sender_id} sent request to ${receiver_id}`);

        res.json({
            success: true
        });

    } catch (err) {

        // console.log(err);
logger.error( `${req.originalUrl} | ${err.stack}` );

        res.status(500).json({
            message: "Server Error"
        });

    }

};

const getRequests = async (req, res) => {

    try {
        
        // const { userId } = req.params;
        const  userId  = req.user.id;

        const [rows] = await db.query(

            `
            SELECT

                c.id,

                c.sender_id,

                u.username,

                u.avatar,

                u.chat_id

            FROM connections c

            JOIN users u

            ON c.sender_id=u.id

            WHERE

            c.receiver_id=?

            AND c.status='PENDING'

            ORDER BY c.created_at DESC
            `,

            [userId]

        );

        res.json(rows);

    }

    catch(err){

        // console.log(err);
logger.error( `${req.originalUrl} | ${err.stack}` );

    }

};

const acceptRequest = async (req, res) => {

    try {
        const receiver_id = req.user.id;
        const { requestId } = req.body;

        await db.query(

            `
            UPDATE connections
            SET status='ACCEPTED'
            WHERE id=?
            AND receiver_id=?
            `,

            [requestId, receiver_id]

        );

        const [rows] = await db.query(

            `
            SELECT
            sender_id,
            receiver_id
            FROM connections
            WHERE id=?
            AND receiver_id=?
            `,

            [requestId, receiver_id]

        );

        const senderSocket =
            global.onlineUsers[rows[0].sender_id];

        const receiverSocket =
            global.onlineUsers[rows[0].receiver_id];

        if (senderSocket) {

            global.io.to(senderSocket).emit(
                "requestAccepted"
            );

        }

        if (receiverSocket) {

            global.io.to(receiverSocket).emit(
                "requestAccepted"
            );

        }

        logger.logRequest( req, "ACCEPT", `Request ${requestId} accepted`);

        res.json({
            success: true
        });

    }

    catch (err) {

        // console.log(err);
        logger.error( `${req.originalUrl} | ${err.stack}` );

    }

};

const rejectRequest = async (req, res) => {

    try {

        const { requestId } = req.body;

        await db.query(

            `
            UPDATE connections
            SET status='REJECTED'
            WHERE id=?
            
            `,

            [requestId]

        );
        logger.logRequest( req, "REJECT", `Request ${requestId} rejected`);

        res.json({
            success: true
        });

    }

    catch (err) {

        // console.log(err);
        logger.error( `${req.originalUrl} | ${err.stack}` );

    }

};
const removeConnection = async (req, res) => {

    try {
        
        const userId = req.user.id;
        const {
            friendId

        } = req.body;

        await db.query(

            `
            DELETE FROM connections

            WHERE

            (
                sender_id=?
                AND
                receiver_id=?
            )

            OR

            (
                sender_id=?
                AND
                receiver_id=?
            )
            `,

            [
                userId,
                friendId,
                friendId,
                userId
            ]

        );

        const senderSocket =
            global.onlineUsers[userId];

        const receiverSocket =
            global.onlineUsers[friendId];

        if (senderSocket) {

            global.io.to(senderSocket).emit(
                "connectionRemoved"
            );

        }

        if (receiverSocket) {

            global.io.to(receiverSocket).emit(
                "connectionRemoved"
            );

        }
        logger.logRequest( req, "REMOVE", `${userId} removed ${friendId}`);

        res.json({
            success: true
        });

    }

    catch(err){

        // console.log(err);
logger.error( `${req.originalUrl} | ${err.stack}` );

    }

};

module.exports = {

    sendRequest,
    getRequests,
    acceptRequest,
    rejectRequest,
    removeConnection,
};