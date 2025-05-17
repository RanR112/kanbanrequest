const prisma = require("../../prisma/client");
const jwt = require("jsonwebtoken");
const { sessionSecrets } = require("../controllers/AuthController");

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ 
        success: false,
        message: "No token provided" 
    });

    try {
        const decodedPayload = jwt.decode(token);
        const userId = decodedPayload?.id_users;

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


// Middleware to authorize admin users
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: "Access denied. User not authenticated.",
        });
    }

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Only ADMIN users can perform this action.",
        });
    }

    next();
};

// Middleware to check if user belongs to Department ID 1
const checkDepartmentAccess = async (req, res, next) => {
    try {
        const userId = req.user.id_users; 

        if (!req.user || !userId) {
            return res.status(401).json({
                success: false,
                message: "Access denied. User not authenticated properly.",
            });
        }

        const user = await prisma.user.findUnique({
            where: { id_users: userId },
            include: { department: true },
        });

        if (!user || user.id_department !== 1) {
            return res.status(403).json({
                success: false,
                message: "Hanya Department PC yang dapat mengakses laporan",
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memverifikasi akses",
        });
    }
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
    checkDepartmentAccess,
};