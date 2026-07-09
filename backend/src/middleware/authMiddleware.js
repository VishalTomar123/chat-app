const jwt = require("jsonwebtoken");
const db = require("../config/db");
const authMiddleware = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const [rows] = await db.query(
        "SELECT token_version FROM users WHERE id=?",
        [decoded.id]
        );
        
        if(rows.length===0){
            return res.status(401).json({
                success: false,
                message:"Unauthorized"
            });
        }

        if(rows[0].token_version !== decoded.version){
        
            return res.status(401).json({
                success: false,
                message:"Session expired"
            });
        
        }

        req.user=decoded;

        next();


    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized"
        });
    }
};

module.exports = authMiddleware;