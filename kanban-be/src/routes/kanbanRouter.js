const express = require("express");
const kanbanRouter = express.Router();
const {
    createKanban,
    getPendingApprovals,
    approveKanban,
    getApprovedKanban,
    getMyRequests,
    getIncomingForPC,
    getApprovedByPCKanban,
    rejectKanban,
} = require("../controllers/KanbanController");
const auth = require("../middlewares/AuthMiddleware");

kanbanRouter.post("/request", auth, createKanban);
kanbanRouter.get("/pending", auth, getPendingApprovals);
kanbanRouter.post("/approve", auth, approveKanban);
kanbanRouter.get("/approved", auth, getApprovedKanban);
kanbanRouter.get("/mine", auth, getMyRequests);
kanbanRouter.get("/incoming-pc", auth, getIncomingForPC);
kanbanRouter.get("/done", auth, getApprovedByPCKanban);
kanbanRouter.post("/reject", auth, rejectKanban);

module.exports = kanbanRouter;
