import { useEffect, useState } from "react";
import API from "../services/api";


export default function StaffInbox() {
    const [list, setList] = useState([]);

    useEffect(() => {
        API.get("/kanban/incoming-pc")
            .then((res) => setList(res.data.incoming))
            .catch(() => console.log("Gagal mengambil data masuk"));
    }, []);

    return (
        <div>
            <h2>Request Masuk ke Staff PC</h2>
            <ul>
                {list.map(({ requestKanban, id_kanban }) => (
                    <li key={id_kanban}>
                        <strong>{requestKanban.parts_number}</strong> - {requestKanban.tgl_produksi}
                    </li>
                ))}
            </ul>
        </div>
    );
}
