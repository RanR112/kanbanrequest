// routes/userRouter.js
const express = require("express");
const UserController = require("../controllers/UserController");
const {
    authenticateToken,
    authorizeAdmin,
} = require("../middlewares/AuthMiddleware");

const userRouter = express.Router();
const userController = new UserController();

userRouter.use(authenticateToken);
userRouter.use(authorizeAdmin);

userRouter.get("/", userController.getAllUsers);
userRouter.get("/:id", userController.getUserById);
userRouter.post("/", userController.createUser);
userRouter.put("/:id", userController.updateUser);
userRouter.delete("/:id", userController.deleteUser);

module.exports = userRouter;
