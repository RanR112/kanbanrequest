import { useState } from "react";
import API from "../services/api";

export default function RequestForm() {
    const [form, setForm] = useState({
        parts_number: "",
        lokasi: "",
        box: "",
        klasifikasi: "",
        keterangan: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
        const formWithDate = {
            ...form,
            tgl_produksi: today,
        };

        try {
            await API.post("/kanban/request", formWithDate);
            alert("Request berhasil dikirim");
        } catch (err) {
            alert("Gagal mengirim request", err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Request Kanban</h2>
            {/* Input tanggal dihapus agar tidak diisi manual */}
            <input
                placeholder="Parts Number"
                name="parts_number"
                onChange={handleChange}
            />
            <input placeholder="Lokasi" name="lokasi" onChange={handleChange} />
            <input placeholder="Box" name="box" onChange={handleChange} />
            <input
                placeholder="Klasifikasi"
                name="klasifikasi"
                onChange={handleChange}
            />
            <textarea
                placeholder="Keterangan"
                name="keterangan"
                onChange={handleChange}
            />
            <button type="submit">Kirim</button>
        </form>
    );
}
