import { useEffect, useState } from "react";
import API from "../services/api";


export default function ApprovedList() {
    const [list, setList] = useState([]);

    useEffect(() => {
        API.get("/kanban/approved")
            .then((res) => setList(res.data.approved))
            .catch(() => alert("Gagal mengambil data approved kanban"));
    }, []);

    return (
        <div>
            <h2>Daftar Kanban yang Sudah Disetujui</h2>
            <ul>
                {list.map((item) => (
                    <li key={item.id_kanban} style={{ marginBottom: "1rem" }}>
                        <strong>{item.parts_number}</strong> -{" "}
                        {item.tgl_produksi}
                        <ul>
                            {item.persetujuan.map((p, index) => (
                                <li key={index}>
                                    <span>
                                        ✅ {p.role} -{" "}
                                        {new Date(p.approvedAt).toLocaleString(
                                            "id-ID"
                                        )}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
}
