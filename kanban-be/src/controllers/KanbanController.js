const prisma = require("../../prisma/client");
const { sendNotification } = require("../utils/notification");

// Department constants
const PC_DEPARTMENT_ID = 1;
const APPROVAL_ROLES = {
    LSM: ["LEADER", "SUPERVISOR", "MANAGER"],
    PC_APPROVERS: ["SUPERVISOR", "MANAGER"],
};

// Status constants
const STATUS = {
    PENDING_PC: "PENDING_PC",
    APPROVED_BY_DEPARTMENT: "APPROVED_BY_DEPARTMENT",
    APPROVED_BY_PC: "APPROVED_BY_PC",
    REJECTED_BY_DEPARTMENT: "REJECTED_BY_DEPARTMENT",
    REJECTED_BY_PC: "REJECTED_BY_PC",
};

// Note constants
const NOTE = {
    PENDING: "Pending",
    APPROVED: "Approved",
    APPROVED_BY_MANAGER: "Approved by Manager",
    PENDING_CLOSURE: "Pending Closure",
    CLOSURE: "Closure",
    REJECTED: "Rejected",
    REJECTED_BY_DEPARTMENT: "Rejected by Department",
    REJECTED_BY_PC: "Rejected by PC",
};

/**
 * Create a new Kanban request
 */
exports.createKanban = async (req, res) => {
    const { id_users } = req.user;
    const { tgl_produksi, nama_requester, parts_number, lokasi, box, klasifikasi, keterangan } =
        req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id_users } });

        const newRequest = await prisma.requestKanban.create({
            data: {
                id_users,
                id_department: user.id_department,
                tgl_produksi: new Date(tgl_produksi),
                nama_requester,
                parts_number,
                lokasi,
                box,
                klasifikasi,
                keterangan,
            },
        });

        // Notify LSM (Leader, Supervisor, Manager) of the same department
        const lsmUsers = await prisma.user.findMany({
            where: {
                id_department: user.id_department,
                role: { in: APPROVAL_ROLES.LSM },
            },
        });

        for (const approver of lsmUsers) {
            await prisma.persetujuan.create({
                data: {
                    id_users: approver.id_users,
                    id_department: approver.id_department,
                    id_kanban: newRequest.id_kanban,
                    role: approver.role,
                    approve: false,
                    note: NOTE.PENDING,
                },
            });

            await sendNotification(
                approver,
                newRequest,
                "Ada request Kanban baru yang perlu Anda approve."
            );
        }

        res.json({
            message: "Request Kanban berhasil dibuat",
            kanban: newRequest,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal membuat request Kanban" });
    }
};

/**
 * Update a Kanban request
 * Only allows editing if no approvals have been made yet
 */
exports.updateKanban = async (req, res) => {
    const { id_users } = req.user;
    const { id_kanban } = req.params;
    const { tgl_produksi, nama_requester, parts_number, lokasi, box, klasifikasi, keterangan } = req.body;

    try {
        // Find the Kanban request first
        const kanban = await prisma.requestKanban.findUnique({
            where: { id_kanban: parseInt(id_kanban) },
            include: {
                persetujuan: true
            }
        });

        // Check if Kanban exists
        if (!kanban) {
            return res.status(404).json({ message: "Request Kanban tidak ditemukan" });
        }

        // Check if user is the creator of the Kanban
        if (kanban.id_users !== id_users) {
            return res.status(403).json({ message: "Anda tidak memiliki akses untuk mengedit Kanban ini" });
        }

        // Check if any approvals have been made
        const hasApproval = kanban.persetujuan.some(approval => approval.approve === true);
        
        if (hasApproval) {
            return res.status(403).json({ 
                message: "Request Kanban tidak dapat diedit karena sudah ada yang melakukan approve"
            });
        }

        // Update the Kanban request
        const updatedKanban = await prisma.requestKanban.update({
            where: { id_kanban: parseInt(id_kanban) },
            data: {
                tgl_produksi: tgl_produksi ? new Date(tgl_produksi) : undefined,
                nama_requester: nama_requester || undefined,
                parts_number: parts_number || undefined,
                lokasi: lokasi || undefined,
                box: box || undefined,
                klasifikasi: klasifikasi || undefined,
                keterangan: keterangan || undefined
            }
        });

        // Notify approvers about the update
        const approvers = await prisma.persetujuan.findMany({
            where: {
                id_kanban: parseInt(id_kanban),
                approve: false
            },
            include: {
                user: true
            }
        });

        for (const approver of approvers) {
            await sendNotification(
                approver.user,
                updatedKanban,
                "Request Kanban yang perlu Anda approve telah diupdate."
            );
        }

        res.json({
            message: "Request Kanban berhasil diperbarui",
            kanban: updatedKanban
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal memperbarui request Kanban" });
    }
};

/**
 * Get pending approvals for the current user
 */
exports.getPendingApprovals = async (req, res) => {
    const { id_users, role, id_department } = req.user;

    try {
        const rejectedNotes = [
            NOTE.REJECTED,
            NOTE.REJECTED_BY_DEPARTMENT,
            NOTE.REJECTED_BY_PC,
        ];

        // Get all requests not yet approved by this user
        const pendingApprovals = await prisma.persetujuan.findMany({
            where: {
                id_users,
                approve: false,
                note: { notIn: rejectedNotes },
            },
            include: {
                requestKanban: {
                    select: {
                        id_kanban: true,
                        id_users: true,
                        id_department: true,
                        tgl_produksi: true,
                        nama_requester: true,
                        parts_number: true,
                        lokasi: true,
                        box: true,
                        klasifikasi: true,
                        keterangan: true,
                        status: true,
                    },
                },
            },
        });

        // Filter out rejected kanban requests
        const filteredApprovals = pendingApprovals.filter((approval) => {
            // Exclude kanban with rejected status
            if (
                approval.requestKanban &&
                (approval.requestKanban.status ===
                    STATUS.REJECTED_BY_DEPARTMENT ||
                    approval.requestKanban.status === STATUS.REJECTED_BY_PC)
            ) {
                return false;
            }
            return true;
        });

        // Get all kanban IDs from pending approvals
        const kanbanIds = filteredApprovals.map(
            (approval) => approval.id_kanban
        );

        // Get all approvals from MANAGER who have already approved
        const approvedByManager = await prisma.persetujuan.findMany({
            where: {
                id_kanban: { in: kanbanIds },
                role: "MANAGER",
                approve: true,
                id_department: id_department,
            },
        });

        const managerApprovedKanbanIds = approvedByManager.map(
            (approval) => approval.id_kanban
        );

        // Final filtering:
        // 1. If current role is LEADER/SUPERVISOR and MANAGER already approved, don't show
        // 2. Don't show rejected kanban
        const finalFilteredApprovals = filteredApprovals.filter((approval) => {
            if (
                (role === "LEADER" || role === "SUPERVISOR") &&
                managerApprovedKanbanIds.includes(approval.id_kanban)
            ) {
                return false;
            }
            return true;
        });

        res.json({ pending: finalFilteredApprovals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil data" });
    }
};

/**
 * Approve a Kanban request
 */
exports.approveKanban = async (req, res) => {
    const { id_kanban } = req.body;
    const { id_users, role, id_department } = req.user;

    try {
        const now = new Date();

        // Update approval status
        const approval = await prisma.persetujuan.update({
            where: {
                id_users_id_department_id_kanban_role: {
                    id_users,
                    id_kanban,
                    id_department,
                    role,
                },
            },
            data: {
                approve: true,
                approvedAt: now,
                note: NOTE.APPROVED,
            },
        });

        if (role === "MANAGER") {
            // Auto approve LEADER/SUPERVISOR when MANAGER approves
            await prisma.persetujuan.updateMany({
                where: {
                    id_kanban,
                    id_department,
                    role: { in: ["LEADER", "SUPERVISOR"] },
                    approve: false,
                },
                data: {
                    approve: true,
                    approvedAt: now,
                    note: NOTE.APPROVED_BY_MANAGER,
                },
            });

            // Update kanban status
            await prisma.requestKanban.updateMany({
                where: {
                    id_kanban,
                    id_department,
                },
                data: {
                    status: STATUS.APPROVED_BY_DEPARTMENT,
                },
            });

            // Check if this is the MANAGER from the requesting department (not PC)
            const request = await prisma.requestKanban.findUnique({
                where: { id_kanban },
            });

            if (id_department === request.id_department) {
                // Send to PC department staff
                const staffPC = await prisma.user.findMany({
                    where: {
                        id_department: PC_DEPARTMENT_ID,
                        role: "STAFF",
                    },
                });

                for (const staff of staffPC) {
                    // Check if record already exists before creating new one
                    const existingRecord = await prisma.persetujuan.findUnique({
                        where: {
                            id_users_id_department_id_kanban_role: {
                                id_users: staff.id_users,
                                id_department: PC_DEPARTMENT_ID,
                                id_kanban,
                                role: "STAFF",
                            },
                        },
                    });

                    if (!existingRecord) {
                        await prisma.persetujuan.create({
                            data: {
                                id_users: staff.id_users,
                                id_department: PC_DEPARTMENT_ID,
                                id_kanban,
                                role: "STAFF",
                                approve: false,
                                note: NOTE.PENDING,
                            },
                        });
                    }

                    await sendNotification(
                        staff,
                        request,
                        "Request Kanban baru menunggu approval Anda (Staff PC)"
                    );
                }
            } else if (
                role === "MANAGER" &&
                id_department === PC_DEPARTMENT_ID
            ) {
                // PC Manager approval case
                const pcStaff = await prisma.user.findMany({
                    where: {
                        id_department: PC_DEPARTMENT_ID,
                        role: "STAFF",
                    },
                });

                await prisma.requestKanban.update({
                    where: { id_kanban },
                    data: {
                        status: STATUS.APPROVED_BY_PC,
                    },
                });

                // Auto approve LEADER/SUPERVISOR when PC MANAGER approves
                await prisma.persetujuan.updateMany({
                    where: {
                        id_kanban,
                        id_department,
                        role: { in: ["LEADER", "SUPERVISOR"] },
                        approve: false,
                    },
                    data: {
                        approve: true,
                        approvedAt: now,
                        note: NOTE.APPROVED_BY_MANAGER,
                    },
                });

                for (const staff of pcStaff) {
                    await prisma.persetujuan.updateMany({
                        where: {
                            id_users: staff.id_users,
                            id_department: PC_DEPARTMENT_ID,
                            id_kanban,
                            role: "STAFF",
                        },
                        data: {
                            approve: false,
                            note: NOTE.PENDING_CLOSURE,
                        },
                    });

                    const kanbanRequest = await prisma.requestKanban.findUnique(
                        {
                            where: { id_kanban },
                        }
                    );

                    await sendNotification(
                        staff,
                        kanbanRequest,
                        "Request Kanban telah diapprove oleh Manager PC. Silakan klik DONE untuk menyelesaikan proses closure."
                    );
                }
            }
        }

        // If approved by PC staff
        if (role === "STAFF" && id_department === PC_DEPARTMENT_ID) {
            // Check if this is closure based on current status or note
            const currentRequest = await prisma.requestKanban.findUnique({
                where: { id_kanban },
            });

            const currentPersetujuan = await prisma.persetujuan.findUnique({
                where: {
                    id_users_id_department_id_kanban_role: {
                        id_users,
                        id_department: PC_DEPARTMENT_ID,
                        id_kanban,
                        role: "STAFF",
                    },
                },
            });

            const isClosureCase =
                currentRequest.status === STATUS.APPROVED_BY_PC ||
                currentPersetujuan.note === NOTE.PENDING_CLOSURE;

            if (isClosureCase) {
                // === CASE: STAFF doing Closure ===
                await prisma.persetujuan.update({
                    where: {
                        id_users_id_department_id_kanban_role: {
                            id_users,
                            id_department: PC_DEPARTMENT_ID,
                            id_kanban,
                            role: "STAFF",
                        },
                    },
                    data: {
                        note: NOTE.CLOSURE,
                        approve: true,
                        approvedAt: now,
                    },
                });

                await prisma.requestKanban.update({
                    where: { id_kanban },
                    data: {
                        status: STATUS.APPROVED_BY_PC,
                    },
                });

                return res.status(200).json({
                    message: "Request Kanban telah di-closure oleh STAFF",
                });
            } else {
                // Add approval for SUPERVISOR and MANAGER PC
                const pcManagers = await prisma.user.findMany({
                    where: {
                        id_department: PC_DEPARTMENT_ID,
                        role: { in: APPROVAL_ROLES.PC_APPROVERS },
                    },
                });

                await prisma.requestKanban.update({
                    where: { id_kanban },
                    data: {
                        status: STATUS.PENDING_PC,
                    },
                });

                for (const manager of pcManagers) {
                    // Check if record already exists before creating new one
                    const existingRecord = await prisma.persetujuan.findUnique({
                        where: {
                            id_users_id_department_id_kanban_role: {
                                id_users: manager.id_users,
                                id_department: PC_DEPARTMENT_ID,
                                id_kanban,
                                role: manager.role,
                            },
                        },
                    });

                    if (!existingRecord) {
                        await prisma.persetujuan.create({
                            data: {
                                id_users: manager.id_users,
                                id_department: PC_DEPARTMENT_ID,
                                id_kanban,
                                role: manager.role,
                                approve: false,
                                note: NOTE.PENDING,
                            },
                        });
                    }
                }

                await prisma.persetujuan.updateMany({
                    where: {
                        id_kanban,
                        note: NOTE.PENDING_CLOSURE,
                    },
                    data: {
                        approve: true,
                        approvedAt: now,
                        note: NOTE.CLOSURE,
                    },
                });
            }
        }

        // Update status response and show success message
        res.status(200).json({
            message:
                role === "STAFF" && id_department === PC_DEPARTMENT_ID
                    ? "Staff PC approval berhasil dilakukan"
                    : "Persetujuan berhasil dilakukan",
            approval,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Terjadi kesalahan saat melakukan persetujuan",
        });
    }
};

/**
 * Get all requests created by the current user
 */
exports.getMyRequests = async (req, res) => {
    try {
        const myRequests = await prisma.requestKanban.findMany({
            where: { id_users: req.user.id_users },
            include: { persetujuan: true },
        });

        res.json({ requests: myRequests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Gagal mengambil data" });
    }
};

/**
 * Get all approved Kanban requests
 */
exports.getApprovedKanban = async (req, res) => {
    try {
        const approvedKanban = await prisma.requestKanban.findMany({
            where: {
                persetujuan: {
                    some: {
                        approve: true,
                    },
                },
            },
            include: {
                persetujuan: {
                    where: {
                        approve: true,
                    },
                    select: {
                        role: true,
                        approvedAt: true,
                    },
                },
            },
            orderBy: {
                tgl_produksi: "desc",
            },
        });

        res.json({ approved: approvedKanban });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Gagal mengambil data approved kanban",
        });
    }
};

/**
 * Get incoming Kanban requests for PC staff
 */
exports.getIncomingForPC = async (req, res) => {
    const { id_users, role, id_department } = req.user;

    if (role !== "STAFF") {
        return res
            .status(403)
            .json({ message: "Hanya Staff PC yang dapat mengakses ini" });
    }

    try {
        const rejectedNotes = [
            NOTE.REJECTED,
            NOTE.REJECTED_BY_DEPARTMENT,
            NOTE.REJECTED_BY_PC,
            "Auto-rejected: Rejected by Department",
            "Auto-rejected: Rejected by PC",
        ];

        const incoming = await prisma.persetujuan.findMany({
            where: {
                id_users,
                approve: false,
                role: "STAFF",
                note: { notIn: rejectedNotes },
            },
            include: {
                requestKanban: {
                    where: {
                        status: {
                            notIn: [
                                STATUS.REJECTED_BY_DEPARTMENT,
                                STATUS.REJECTED_BY_PC,
                            ],
                        },
                    },
                },
            },
        });

        // Filter out entries with null requestKanban
        const filteredIncoming = incoming.filter(
            (item) => item.requestKanban !== null
        );

        res.json({ incoming: filteredIncoming });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data" });
    }
};

/**
 * Get all Kanban requests approved by PC
 */
exports.getApprovedByPCKanban = async (req, res) => {
    try {
        const approvedKanbanList = await prisma.requestKanban.findMany({
            where: {
                status: STATUS.APPROVED_BY_PC,
            },
            orderBy: {
                id_kanban: "desc",
            },
        });

        res.status(200).json(approvedKanbanList);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Gagal mengambil data kanban yang disetujui PC",
        });
    }
};

/**
 * Reject a Kanban request
 */
exports.rejectKanban = async (req, res) => {
    const { id_kanban, alasan } = req.body;
    const { id_users, id_department, role } = req.user;

    try {
        const request = await prisma.requestKanban.findUnique({
            where: { id_kanban },
        });

        if (!request) {
            return res.status(404).json({ message: "Kanban tidak ditemukan" });
        }

        // Determine status based on department
        const status =
            id_department === PC_DEPARTMENT_ID
                ? STATUS.REJECTED_BY_PC
                : STATUS.REJECTED_BY_DEPARTMENT;

        const rejectionNote =
            id_department === PC_DEPARTMENT_ID
                ? NOTE.REJECTED_BY_PC
                : NOTE.REJECTED_BY_DEPARTMENT;

        // Update current user's approval to rejected
        await prisma.persetujuan.update({
            where: {
                id_users_id_department_id_kanban_role: {
                    id_users,
                    id_department,
                    id_kanban,
                    role,
                },
            },
            data: {
                approve: false,
                note: alasan || rejectionNote,
                approvedAt: new Date(),
            },
        });

        // Update kanban status
        await prisma.requestKanban.update({
            where: { id_kanban },
            data: {
                status,
            },
        });

        // Update all pending approvals for this kanban to rejected
        await prisma.persetujuan.updateMany({
            where: {
                id_kanban,
                approve: false,
                note: NOTE.PENDING,
            },
            data: {
                note: `Auto-rejected: ${alasan || rejectionNote}`,
            },
        });

        // Send notification to requesting user
        const requestUser = await prisma.user.findUnique({
            where: { id_users: request.id_users },
        });

        if (requestUser) {
            await sendNotification(
                requestUser,
                request,
                `Request Kanban Anda telah ditolak dengan alasan: ${
                    alasan || rejectionNote
                }`
            );
        }

        res.json({
            message: "Request Kanban ditolak",
            status,
            detail: "Semua approval yang pending untuk kanban ini telah diubah menjadi rejected",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menolak request Kanban" });
    }
};
