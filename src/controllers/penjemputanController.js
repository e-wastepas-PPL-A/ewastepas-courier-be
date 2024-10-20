let permintaan = [
    { id: 101, alamat: "Jl. Raya No. 1", jenis_sampah: "Televisi", status: "Menunggu", tanggal: "2024-10-20" },
    { id: 102, alamat: "Jl. Merdeka No. 5", jenis_sampah: "Kulkas", status: "Diterima", tanggal: "2024-10-19" },
];

let history = [
    { id: 1, alamat: "Jl. Raya No. 1", jenis_sampah: "Televisi", tanggal: "2024-10-20", status: "Selesai" },
    { id: 2, alamat: "Jl. Merdeka No. 5", jenis_sampah: "Kulkas", tanggal: "2024-10-19", status: "Selesai" },
];

export const getPermintaan = (req, res) => {
    res.json({ data: permintaan });
}

export const terimaPermintaan = (req, res) => {
    const { permintaan_id } = req.body;
    const foundPermintaanIndex = permintaan.findIndex(item => item.id === permintaan_id);

    if (foundPermintaanIndex !== -1) {
        permintaan[foundPermintaanIndex].status = "Diterima";
        return res.json({
            message: "Permintaan penjemputan berhasil diterima.",
            permintaan_id
        });
    }

    return res.status(404).json({ message: "Permintaan tidak ditemukan." });
}

export const getHistory = (req, res) => {
    res.json({ data: history });
};