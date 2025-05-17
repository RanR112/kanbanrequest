const express = require("express");
const reportRouter = express.Router();
const { checkDepartmentAccess, authenticateToken } = require("../middlewares/AuthMiddleware");
const {
    getMonthlyReport,
    downloadMonthlyReport,
    getReportStatistics,
} = require("../controllers/ReportController");

reportRouter.use(authenticateToken);
reportRouter.use(checkDepartmentAccess);

reportRouter.get("/monthly", getMonthlyReport);
reportRouter.get("/monthly/download", downloadMonthlyReport);
reportRouter.get("/statistics", getReportStatistics);

module.exports = reportRouter;
