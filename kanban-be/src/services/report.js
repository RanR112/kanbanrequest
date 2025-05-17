const prisma = require("../../prisma/client");
const { format } = require("date-fns");
const { id } = require("date-fns/locale");

// Helper function to get monthly report data
async function getMonthlyReportData(startDate, endDate) {
    const kanbanRequests = await prisma.requestKanban.findMany({
        where: {
            tgl_produksi: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            user: {
                select: {
                    name: true,
                    role: true,
                },
            },
            department: {
                select: {
                    name: true,
                },
            },
            persetujuan: {
                include: {
                    user: {
                        select: {
                            name: true,
                            role: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            tgl_produksi: "asc",
        },
    });

    return kanbanRequests.map((request) => {
        // Find the latest approval (if any)
        const sortedApprovals = request.persetujuan.sort((a, b) => {
            if (!a.approvedAt) return 1;
            if (!b.approvedAt) return -1;
            return b.approvedAt.getTime() - a.approvedAt.getTime();
        });

        const latestApproval =
            sortedApprovals.length > 0 ? sortedApprovals[0] : null;

        return {
            id_kanban: request.id_kanban,
            requester: request.user.name,
            department: request.department.name,
            tgl_produksi: format(request.tgl_produksi, "dd/MM/yyyy"),
            parts_number: request.parts_number,
            lokasi: request.lokasi,
            box: request.box,
            klasifikasi: request.klasifikasi,
            keterangan: request.keterangan,
            status: request.status,
            lastApproval: latestApproval
                ? {
                      approver: latestApproval.user.name,
                      role: latestApproval.role,
                      approved: latestApproval.approve,
                      date: latestApproval.approvedAt
                          ? format(
                                latestApproval.approvedAt,
                                "dd/MM/yyyy HH:mm"
                            )
                          : null,
                      note: latestApproval.note,
                  }
                : null,
        };
    });
}

// Helper function to get report statistics
async function getReportStatistics(startDate, endDate) {
    const statusCounts = await prisma.requestKanban.groupBy({
        by: ["status"],
        where: {
            tgl_produksi: {
                gte: startDate,
                lte: endDate,
            },
        },
        _count: {
            id_kanban: true,
        },
    });

    const departmentCounts = await prisma.requestKanban.groupBy({
        by: ["id_department"],
        where: {
            tgl_produksi: {
                gte: startDate,
                lte: endDate,
            },
        },
        _count: {
            id_kanban: true,
        },
    });

    const departments = await prisma.department.findMany();
    const departmentMap = departments.reduce((map, dept) => {
        map[dept.id_department] = dept.name;
        return map;
    }, {});

    const departmentStatistics = departmentCounts.map((item) => ({
        department:
            departmentMap[item.id_department] ||
            `Department ID ${item.id_department}`,
        count: item._count.id_kanban,
    }));
    // Get the total count
    const totalCount = await prisma.requestKanban.count({
        where: {
            tgl_produksi: {
                gte: startDate,
                lte: endDate,
            },
        },
    });

    return {
        total: totalCount,
        byStatus: statusCounts.map((item) => ({
            status: item.status,
            count: item._count.id_kanban,
        })),
        byDepartment: departmentStatistics,
    };
}

module.exports = {
    getMonthlyReportData,
    getReportStatistics,
};
