const jenisSampah = [
    { id: 1, nama: "Televisi", kategori: "Peralatan Rumah Tangga" },
    { id: 2, nama: "Kulkas", kategori: "Peralatan Rumah Tangga" },
];

const totalSampah = [
    {total: 50, jenis: "Televisi"},
    {total: 50, jenis: "Kulkas"},
];

export const getJenisSampah = (req, res) => {
    res.json({ data: jenisSampah });
}

export const getTotalSampah = (req, res) => {
    res.json({ data: totalSampah });
}