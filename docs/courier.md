# Courier API Documentation

## Endpoint: Melihat Jenis dan Kategori Sampah Elektronik
- GET: `/api/sampah/jenis`
- Response:
```json
{
  "data": [
    {
      "id": 1,
      "nama": "Televisi",
      "kategori": "Peralatan Rumah Tangga"
    },
    {
      "id": 2,
      "nama": "Kulkas",
      "kategori": "Peralatan Rumah Tangga"
    }
  ]
}
```

## Endpoint: Melihat Permintaan Penjemputan Sampah Elektronik
- GET: `/api/penjemputan/permintaan`
- Response:
```json
{
  "data": [
    {
      "id": 101,
      "alamat": "Jl. Raya No. 1",
      "jenis_sampah": "Televisi",
      "status": "Menunggu",
      "tanggal": "2024-10-20"
    },
    {
      "id": 102,
      "alamat": "Jl. Merdeka No. 5",
      "jenis_sampah": "Kulkas",
      "status": "Diterima",
      "tanggal": "2024-10-19"
    }
  ]
}
```

## Endpoint: Menerima Permintaan Penjemputan Sampah Elektronik
- POST: `/api/penjemputan/terima`
- Request Body:
```json
{
  "permintaan_id": 101
}
```
Response:
```json
{
  "message": "Permintaan penjemputan berhasil diterima.",
  "permintaan_id": 101
}
```

## Endpoint: Melihat Lokasi Drop Box Terdekat
- GET: `/api/dropbox/terdekat`
- Response:
```json
{
  "data": [
    {
      "id": 1,
      "alamat": "Drop Box 1",
      "jarak": "500m"
    },
    {
      "id": 2,
      "alamat": "Drop Box 2",
      "jarak": "1km"
    }
  ]
} 
```

## Endpoint: Melihat Total Sampah Elektronik yang Sudah Dijemput
- GET: `/api/sampah/total`
- Response: 
```json
{
  "total_sampah": 50,
  "jenis": "Televisi"
}
```

## Endpoint: Melihat History Penjemputan Sampah Elektronik
- GET: `/api/penjemputan/history`
- Response:
```json
{
  "data": [
    {
      "id": 1,
      "alamat": "Jl. Raya No. 1",
      "jenis_sampah": "Televisi",
      "tanggal": "2024-10-20",
      "status": "Selesai"
    },
    {
      "id": 2,
      "alamat": "Jl. Merdeka No. 5",
      "jenis_sampah": "Kulkas",
      "tanggal": "2024-10-19",
      "status": "Selesai"
    }
  ]
}
```