const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../../prisma/client");

const sessionSecrets = {};

// Generate random JWT secret (temporary per session)
const generateRandomSecret = (length = 16) => {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Cari user berdasarkan email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Cek password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const secretKey = generateRandomSecret();
        sessionSecrets[user.id_users] = secretKey;

        // Generate token
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

        return res.json({
            message: "Login successful",
            token,
            status: "success",
        });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Server error" });
    }
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

    const userId = decoded?.id_users;

    if (!userId || !sessionSecrets[userId]) {
        return res.status(400).json({ message: "Session not found" });
    }

    delete sessionSecrets[userId];
    return res.json({ message: "Logout successful" });
};

exports.sessionSecrets = sessionSecrets;
