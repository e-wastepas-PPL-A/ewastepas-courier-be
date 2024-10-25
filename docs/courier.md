# Courier API Documentation

## Endpoint: Registrasi
- POST: `/api/auth/registration`
- Request Body:
```json
{
  "email" : "jamjam@gmail.com",
  "password" : "12345678",
  "password2" : "12345678"
}
```
- Response:
```json
{
   "message": "Registration successful.",
    "data": {
        "id_user": 1,
        "Nama": null,
        "Email": "jamjam@gmail.com",
        "No_Telp": null,
        "Tgl_Lahir": null,
        "Alamat": null,
        "NIK": null,
        "No_Rek": null,
        "KTP_URL": null,
        "KK_URL": null,
        "Foto": null,
        "Total_Point": null,
        "Berat_Sampah": null,
        "Roles": 1,
        "Created_at": "2024-10-25T08:18:03.000Z",
        "Updated_at": "2024-10-25T08:18:03.000Z",
        "Is_verified": 0,
        "Status": "pending",
        "Password": "$2b$10$qWDtcKZLAlTZMzdP.hDid.CFfwmcPu1e3QpDdUuPnLZL3O1ZYhDse"
    }
}
```

## Endpoint: Verifikasi OTP
- POST: `/api/auth/verify_otp`
- Request Body:
```json
{
  "id" : 1,
  "otp" : "678989",
}
```
- Response:
```json
{
  "message": "User has been verified."
}
```

## Endpoint: Login
- POST: `/api/auth/login`
- Request Body:
```json
{
  "email" : "asukayang@gmail.com",
  "password" : "12345678",
}
```
- Response:
```json
{
   "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1hc2EgaWQgcGFrZSB0aXBlIGRhdGEgc3RyaW5nIiwiZW1haWwiOiJtcml6a2loYWlrYWwyOTRAZ21haWwuY29tIiwicm9sZSI6bnVsbCwiaWF0IjoxNzI5ODQzOTU1LCJleHAiOjE3Mjk4NjU1NTV9.Mvdpfi01-k2u6gvJp0LsB1VeG2HjoUn-VMIhpDV43Ow",
    "user": {
        "id": "masa id pake tipe data string",
        "email": "asukayang@gmail.com",
        "role": 1
    }
}
```

## Endpoint: Ubah kata sandi
- POST: `/api/user/change_password`
- Request Body:
```json
{
  "email" : "jamjam@gmail.com",
  "old_password" : "12345678",
  "password" : "12345678",
   "password2" : "12345678"
}
```
- Response:
```json
{
  "message": "Change password successfully."
}
```


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