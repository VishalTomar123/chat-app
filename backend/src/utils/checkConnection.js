const db = require("../config/db");

const checkConnection = async (userId, friendId) => {

    const [rows] = await db.query(
        `
        SELECT id
        FROM connections
        WHERE
        (
            (sender_id=? AND receiver_id=?)
            OR
            (sender_id=? AND receiver_id=?)
        )
        AND status='ACCEPTED'
        LIMIT 1
        `,
        [
            userId,
            friendId,
            friendId,
            userId
        ]
    );

    return rows.length > 0;
};

module.exports = checkConnection;