import { useEffect, useState } from "react";
import API from "../services/api";


export default function ClosureList() {
    const [list, setList] = useState([]);

    useEffect(() => {
        API.get("/kanban/done")
            .then((res) => setList(res.data))
            .catch(() => alert("Gagal mengambil data closure kanban"));
    }, []);

    return (
        <div>
            <h2>Daftar Closure Kanban</h2>
            <ul>
            {list.map((item) => (
                    <li key={item.id_kanban} style={{ marginBottom: "1rem" }}>
                        <strong>{item.parts_number}</strong> -{" "}
                        {item.tgl_produksi} &nbsp;&nbsp; <b style={{ color: "lightgreen" }}>APPROVED</b>
                    </li>
                ))}
            </ul>
        </div>
    );
}
