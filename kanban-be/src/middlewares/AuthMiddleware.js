const jwt = require("jsonwebtoken");
const { sessionSecrets } = require("../controllers/AuthController");

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ 
        success: false,
        message: "No token provided" 
    });

    try {
        const decodedPayload = jwt.decode(token);
        const userId = decodedPayload?.id;

        const secret = sessionSecrets[userId];
        if (!secret)
            return res
                .status(403)
                .json({ 
                    success: false,
                    message: "Session not found. Please login again." 
                });

        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ 
                    success: false,
                    message: "Session expired. Please login again." 
                });
        }

        return res.status(403).json({ 
            success: false,
            message: "Invalid token" 
        });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. User not authenticated.'
        });
    }

    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Only ADMIN users can perform this action.'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin
};