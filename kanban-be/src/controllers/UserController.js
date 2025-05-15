const prisma = require("../../prisma/client");

class UserController {

    async getAllUsers(req, res) {
        try {
            const users = await prisma.user.findMany({
                include: {
                    department: true,
                },
            });

            return res.status(200).json({
                success: true,
                data: users,
            });
        } catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch users",
                error: error.message,
            });
        }
    }

    async getUserById(req, res) {
        const { id } = req.params;

        try {
            const user = await prisma.user.findUnique({
                where: {
                    id_users: parseInt(id),
                },
                include: {
                    department: true,
                },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            return res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            console.error("Error fetching user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch user",
                error: error.message,
            });
        }
    }

    /**
     * Create new user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createUser(req, res) {
        const { id_department, name, role, email, no_hp, password } = req.body;

        // Validate required fields
        if (!id_department || !name || !role || !email || !no_hp || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        try {
            // Check if user with email already exists
            const existingUser = await prisma.user.findUnique({
                where: {
                    email,
                },
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: "Email already in use",
                });
            }

            // Check if department exists
            const department = await prisma.department.findUnique({
                where: {
                    id_department: parseInt(id_department),
                },
            });

            if (!department) {
                return res.status(404).json({
                    success: false,
                    message: "Department not found",
                });
            }

            // Hash password before storing
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create new user
            const newUser = await prisma.user.create({
                data: {
                    id_department: parseInt(id_department),
                    name,
                    role,
                    email,
                    no_hp,
                    password: hashedPassword,
                },
                include: {
                    department: true,
                },
            });

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                data: newUser,
            });
        } catch (error) {
            console.error("Error creating user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create user",
                error: error.message,
            });
        }
    }

    /**
     * Update user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateUser(req, res) {
        const { id } = req.params;
        const { id_department, name, role, email, no_hp, password } = req.body;

        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: {
                    id_users: parseInt(id),
                },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // If updating email, check if it's already in use
            if (email && email !== user.email) {
                const existingUser = await prisma.user.findUnique({
                    where: {
                        email,
                    },
                });

                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        message: "Email already in use",
                    });
                }
            }

            // Prepare update data
            const updateData = {};

            if (id_department)
                updateData.id_department = parseInt(id_department);
            if (name) updateData.name = name;
            if (role) updateData.role = role;
            if (email) updateData.email = email;
            if (no_hp) updateData.no_hp = no_hp;

            // Hash password if provided
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            // Update user
            const updatedUser = await prisma.user.update({
                where: {
                    id_users: parseInt(id),
                },
                data: updateData,
                include: {
                    department: true,
                },
            });

            return res.status(200).json({
                success: true,
                message: "User updated successfully",
                data: updatedUser,
            });
        } catch (error) {
            console.error("Error updating user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to update user",
                error: error.message,
            });
        }
    }

    /**
     * Delete user
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteUser(req, res) {
        const { id } = req.params;

        try {
            // Check if user exists
            const user = await prisma.user.findUnique({
                where: {
                    id_users: parseInt(id),
                },
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            // Delete user
            await prisma.user.delete({
                where: {
                    id_users: parseInt(id),
                },
            });

            return res.status(200).json({
                success: true,
                message: "User deleted successfully",
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete user",
                error: error.message,
            });
        }
    }
}

module.exports = UserController;
