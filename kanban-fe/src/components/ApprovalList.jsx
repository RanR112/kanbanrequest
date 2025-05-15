import { useEffect, useState } from "react";
import API from "../services/api";

export default function ApprovalList() {
    const [list, setList] = useState([]);

    useEffect(() => {
        API.get("/kanban/pending")
            .then((res) => setList(res.data.pending))
            .catch((err) => alert("Gagal mengambil data", err));
    }, []);

    const handleApprove = async (id_kanban) => {
        try {
            await API.post("/kanban/approve", { id_kanban });
            alert("Berhasil approve");
            setList(list.filter((l) => l.id_kanban !== id_kanban));
        } catch (err) {
            alert("Gagal approve", err);
        }
    };

    const handleReject = async (id_kanban) => {
        const confirmReject = window.confirm("Apakah Anda yakin ingin menolak permintaan ini?");
        if (!confirmReject) return;

        try {
            await API.post("/kanban/reject", { id_kanban });
            alert("Berhasil reject");
            setList(list.filter((l) => l.id_kanban !== id_kanban));
        } catch (err) {
            alert("Gagal reject", err);
        }
    };

    return (
        <div>
            <h2>Pending Approval</h2>
            {list.length === 0 ? (
                <p>Tidak ada permintaan approval</p>
            ) : (
                <ul>
                    {list.map((item) => (
                        <li key={item.id_kanban} style={{ marginBottom: "10px" }}>
                            <strong>{item.requestKanban.parts_number}</strong> - {item.requestKanban.tgl_produksi}
                            <div style={{ marginTop: "5px" }}>
                                <button onClick={() => handleApprove(item.id_kanban)} style={{ marginRight: "10px" }}>
                                    Approve
                                </button>
                                <button onClick={() => handleReject(item.id_kanban)} style={{ backgroundColor: "#f44336", color: "white" }}>
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
