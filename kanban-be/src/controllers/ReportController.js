const { format } = require("date-fns");
const { id } = require("date-fns/locale");
const reportService = require("../services/report");
const pdfUtils = require("../utils/pdf");

// Get monthly report data (for display in UI)
exports.getMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: "Tahun dan bulan harus disediakan",
            });
        }

        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);

        const reportData = await reportService.getMonthlyReportData(
            startDate,
            endDate
        );

        return res.status(200).json({
            success: true,
            data: reportData,
        });
    } catch (error) {
        console.error("Error fetching monthly report:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data laporan",
        });
    }
};

// Get download monthly report
exports.downloadMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: "Tahun dan bulan harus disediakan",
            });
        }

        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);

        const reportData = await reportService.getMonthlyReportData(
            startDate,
            endDate
        );

        const monthName = format(startDate, "MMMM yyyy", { locale: id });

        pdfUtils.createPdfReport(res, reportData, monthName);
    } catch (error) {
        console.error("Error generating PDF report:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat membuat laporan PDF",
        });
    }
};

// Get report statistics (summary data)
exports.getReportStatistics = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({
                success: false,
                message: "Tahun dan bulan harus disediakan",
            });
        }

        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);

        const statistics = await reportService.getReportStatistics(
            startDate,
            endDate
        );

        return res.status(200).json({
            success: true,
            data: statistics,
        });
    } catch (error) {
        console.error("Error fetching report statistics:", error);
        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil statistik laporan",
        });
    }
};
