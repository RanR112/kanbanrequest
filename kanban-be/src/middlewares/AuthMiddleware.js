const jwt = require("jsonwebtoken");
const { sessionSecrets } = require("../controllers/AuthController");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decodedPayload = jwt.decode(token);
        const userId = decodedPayload?.id;

        const secret = sessionSecrets[userId];
        if (!secret)
            return res
                .status(403)
                .json({ message: "Session not found. Please login again." });

        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res
                .status(401)
                .json({ message: "Session expired. Please login again." });
        }

        return res.status(403).json({ message: "Invalid token" });
    }
};

module.exports = authMiddleware;
