export const getDropbox = (req, res) => {
    const dropbox = [
        { id: 1, alamat: "Drop Box 1", jarak: "500m" },
        { id: 2, alamat: "Drop Box 2", jarak: "1km" },
    ];

    return res.json({ data: dropbox });
};