const express = require('express');
const authRouter = require('./authRouter');
const kanbanRouter = require('./kanbanRouter');
const router = express.Router();

router.use('/auth', authRouter)
router.use('/kanban', kanbanRouter)

module.exports = router;