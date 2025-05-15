const db = require("../utils/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sessionSecrets = {};

const generateRandomSecret = (length = 16) => {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) return res.status(500).json({ message: "Server error" });
            if (result.length === 0)
                return res.status(404).json({ message: "User not found" });

            const user = result[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch)
                return res.status(401).json({
                    message: "Invalid credentials",
                });

            const secretKey = generateRandomSecret();
            sessionSecrets[user.id] = secretKey;

            const token = jwt.sign(
                {
                    id_users: user.id_users,
                    email: user.email,
                    role: user.role,
                    id_department: user.id_department,
                },
                secretKey,
                { expiresIn: "30m" }
            );

            res.json({
                message: "Login successful",
                token: token,
                status: "success",
            });
        }
    );
};

exports.logout = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch (error) {
        return res.status(400).json({ message: "Invalid token" });
    }

    if (!decoded || !decoded.id) {
        return res.status(400).json({ message: "Invalid token payload" });
    }

    const userId = decoded.id;

    if (!sessionSecrets[userId]) {
        return res.status(400).json({ message: "Session not found" });
    }

    delete sessionSecrets[userId];

    return res.json({ message: "Logout successful" });
};

exports.sessionSecrets = sessionSecrets;
