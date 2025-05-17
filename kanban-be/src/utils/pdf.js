const PDFDocument = require("pdfkit");
const { format } = require("date-fns");
const { id } = require("date-fns/locale");

// Helper function to generate PDF content
function generatePdfContent(doc, reportData, monthName) {
    doc.fontSize(20).text(`LAPORAN REQUEST KANBAN`, { align: "center" });
    doc.fontSize(14).text(monthName, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10).text(
        `Tanggal Cetak: ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
        { align: "right" }
    );
    doc.moveDown(1);

    const tableTop = 200;
    const columnWidths = {
        id: 30,
        date: 70,
        requester: 80,
        department: 80,
        parts: 70,
        location: 60,
        box: 40,
        class: 40,
        status: 70,
    };

    doc.fontSize(8)
        .text("ID", 50, tableTop)
        .text("Tgl Produksi", 80, tableTop)
        .text("Requester", 150, tableTop)
        .text("Department", 230, tableTop)
        .text("Parts Number", 310, tableTop)
        .text("Lokasi", 380, tableTop)
        .text("Box", 440, tableTop)
        .text("Klasifikasi", 480, tableTop)
        .text("Status", 520, tableTop);

    doc.moveTo(50, tableTop + 15)
        .lineTo(550, tableTop + 15)
        .stroke();

    let rowY = tableTop + 25;

    reportData.forEach((item, i) => {
        if (rowY > 700) {
            doc.addPage();
            rowY = 50;

            doc.fontSize(8)
                .text("ID", 50, rowY)
                .text("Tgl Produksi", 80, rowY)
                .text("Requester", 150, rowY)
                .text("Department", 230, rowY)
                .text("Parts Number", 310, rowY)
                .text("Lokasi", 380, rowY)
                .text("Box", 440, rowY)
                .text("Klasifikasi", 480, rowY)
                .text("Status", 520, rowY);

            doc.moveTo(50, rowY + 15)
                .lineTo(550, rowY + 15)
                .stroke();

            rowY += 25;
        }

        let status = item.status;
        switch (item.status) {
            case "PENDING_APPROVAL":
                status = "Menunggu Persetujuan";
                break;
            case "APPROVED_BY_DEPARTMENT":
                status = "Disetujui Departemen";
                break;
            case "PENDING_PC":
                status = "Menunggu PC";
                break;
            case "APPROVED_BY_PC":
                status = "Disetujui PC";
                break;
            case "REJECTED_BY_DEPARTMENT":
                status = "Ditolak Departemen";
                break;
            case "REJECTED_BY_PC":
                status = "Ditolak PC";
                break;
        }

        doc.fontSize(8)
            .text(item.id_kanban.toString(), 50, rowY)
            .text(item.tgl_produksi, 80, rowY)
            .text(item.requester, 150, rowY, {
                width: columnWidths.requester,
                ellipsis: true,
            })
            .text(item.department, 230, rowY, {
                width: columnWidths.department,
                ellipsis: true,
            })
            .text(item.parts_number, 310, rowY, {
                width: columnWidths.parts,
                ellipsis: true,
            })
            .text(item.lokasi, 380, rowY, {
                width: columnWidths.location,
                ellipsis: true,
            })
            .text(item.box, 440, rowY)
            .text(item.klasifikasi, 480, rowY)
            .text(status, 520, rowY, {
                width: columnWidths.status,
                ellipsis: true,
            });

        doc.moveTo(50, rowY + 15)
            .lineTo(550, rowY + 15)
            .stroke();

        rowY += 20;
    });

    doc.moveDown(2);
    doc.fontSize(10).text(`Total Permintaan: ${reportData.length}`, {
        align: "right",
    });

    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
            `Halaman ${i + 1} dari ${totalPages}`,
            50,
            doc.page.height - 50,
            { align: "center" }
        );
    }
}

// Helper function to create a PDF report
function createPdfReport(res, reportData, monthName) {
    const doc = new PDFDocument({ margin: 50 });

    const fileName = `Laporan_Kanban_${monthName.replace(" ", "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    doc.pipe(res);

    generatePdfContent(doc, reportData, monthName);

    doc.end();
}

module.exports = {
    createPdfReport,
};
