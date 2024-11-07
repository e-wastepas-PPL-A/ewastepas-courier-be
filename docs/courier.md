# Courier API Documentation

## Endpoint: Registrasi
- POST: `/api/auth/registration`
- Request Body:
```json
{
  "email" : "jamjam@gmail.com",
  "password" : "12345678",
  "confirm_password" : "12345678"
}
```
- Response:
```json
{
    "message": "Registration successful.",
    "data": {
        "id_user": 10,
        "Nama": null,
        "Email": "jamjam@gmail.com",
        "Password": "$2b$10$B.SEk1SjZX9e4tdOTcq/XuuczAjER5GNaIqnjX5Zoh74csk6vRS76",
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
        "Roles": "kurir",
        "Status": "Tertunda",
        "is_verified": false,
        "Created_at": "2024-10-25T12:11:04.000Z",
        "Updated_at": "2024-10-25T12:11:04.000Z"
    }
}
```
## Endpoint: Kirim OTP/Kirim ulang OTP
- POST: `/api/auth/send-otp`
- Request Body:
```json
{
  "email" : "jamjam@gmail.com"
}
```
- Response:
```json
{
    "message": "OTP send to your email"
}
```

## Endpoint: Verifikasi OTP
- POST: `/api/auth/verify-otp`
- Request Body:
```json (registration)
{
    "email" : "jamjam@gmail.com",
    "otp" : "816662",
    "type" : "registration"
}
```
- Response:
```json
{
  "message": "User has been verified."
}
```
- Request Body:
```json (forgot_password)
{
    "email" : "jamjam@gmail.com",
    "otp" : "816662",
    "type" : "forgot_password"
}
```
- Response:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1yaXpraWhhaWthbDI5NEBnbWFpbC5jb20iLCJpYXQiOjE3MzAwNTE1NjIsImV4cCI6MTczMDA1MjE2Mn0.Ba8-DWYWyVZsQRqwSHFZaQvxYDpVEdUs5lCBeB_SeEk"
}
```

## Endpoint: Lupa kata sandi
- PATCH: `/api/auth/forgot-password`
- Request Headers:
```json
{
  "Authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1yaXpraWhhaWthbDI5NEBnbWFpbC5jb20iLCJpYXQiOjE3MzAwNTE1NjIsImV4cCI6MTczMDA1MjE2Mn0.Ba8-DWYWyVZsQRqwSHFZaQvxYDpVEdUs5lCBeB_SeEk"
}
```
- Request Body:
```json
{
    "new_password": "12345678",
    "confirm_new_password" : "12345678"
}
```
- Response:
```json
{
    "message": "Change password succesfully."
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
        "id": 1,
        "email": "asukayang@gmail.com",
        "role": "kurir"
    }
}
```
## Endpoint: Data user login
- GET: `/api/users`
- Request Headers:
```json
{
  "authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1hc2EgaWQgcGFrZSB0aXBlIGRhdGEgc3RyaW5nIiwiZW1haWwiOiJtcml6a2loYWlrYWwyOTRAZ21haWwuY29tIiwicm9sZSI6bnVsbCwiaWF0IjoxNzI5ODQzOTU1LCJleHAiOjE3Mjk4NjU1NTV9.Mvdpfi01-k2u6gvJp0LsB1VeG2HjoUn-VMIhpDV43Ow"
}
```
- Response:
```json
{
    "user": {
        "id_user": 10,
        "Nama": "Rizki",
        "Email": "mrizhs294@gmail.com",
        "Password": "$2b$10$lAuYW99ZfLfoTfAUcN6Rc.FW9HkcQ7WIc6ZvNCp7qxNyx027Qj5He",
        "No_Telp": "08345678",
        "Tgl_Lahir": "2024-10-24T00:00:00.000Z",
        "Alamat": "Bandung",
        "NIK": "1234578",
        "No_Rek": "0987654321",
        "KTP_URL": "uploads/images/1729860931607-160855621.png",
        "KK_URL": "uploads/images/1729860931611-319170024.png",
        "Foto": "uploads/images/1729860931605-310423796.png",
        "Total_Point": null,
        "Berat_Sampah": null,
        "Roles": "kurir",
        "Status": "Tertunda",
        "is_verified": true,
        "Created_at": "2024-10-25T12:11:04.000Z",
        "Updated_at": "2024-10-25T19:55:31.000Z"
    }
}
```

## Endpoint: Lengkapi data user
- PATCH: `/api/users/:id`
- Request Headers:
```json
{
  "authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1hc2EgaWQgcGFrZSB0aXBlIGRhdGEgc3RyaW5nIiwiZW1haWwiOiJtcml6a2loYWlrYWwyOTRAZ21haWwuY29tIiwicm9sZSI6bnVsbCwiaWF0IjoxNzI5ODQzOTU1LCJleHAiOjE3Mjk4NjU1NTV9.Mvdpfi01-k2u6gvJp0LsB1VeG2HjoUn-VMIhpDV43Ow"
}
```
- Request Body:

| Field          | Type           | Description                               |
|----------------|----------------|-------------------------------------------|
| `name`         | `string`       | Nama lengkap pengguna                     |
| `address`      | `string`       | Alamat lengkap pengguna                   |
| `nik`          | `string`       | Nomor Induk Kependudukan (NIK)           |
| `date_of_birth`| `string`       | Tanggal lahir dalam format `YYYY-MM-DD`   |
| `phone_number` | `string`       | Nomor telepon pengguna                    |
| `account_number`| `string`      | Nomor rekening pengguna                   |
| `profile_picture` | `file`      | Foto profil pengguna dalam format gambar  |
| `ktp`          | `file`         | Foto atau scan KTP dalam format gambar    |
| `kk`           | `file`         | Foto atau scan Kartu Keluarga (KK)        |

- Response:
```json
{
    "message": "Data successfully updated",
    "data": {
        "count": 1
    }
}
```

## Endpoint: Ubah kata sandi
- PATCH: `/api/users/change-password`
- Request Headers:
```json
{
  "authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im1hc2EgaWQgcGFrZSB0aXBlIGRhdGEgc3RyaW5nIiwiZW1haWwiOiJtcml6a2loYWlrYWwyOTRAZ21haWwuY29tIiwicm9sZSI6bnVsbCwiaWF0IjoxNzI5ODQzOTU1LCJleHAiOjE3Mjk4NjU1NTV9.Mvdpfi01-k2u6gvJp0LsB1VeG2HjoUn-VMIhpDV43Ow"
}
```
- Request Body:
```json
{
    "old_password" : "87654321",
    "new_password" : "12345678",
    "confirm_new_password" : "12345678"
}
```
- Response:
```json
{
  "message": "Change password successfully."
}
```


## Endpoint: Melihat Jenis dan Kategori Sampah Elektronik
- GET: `/api/waste`
- Response:
```json
{
     "data": [
            {
                "waste_id": 1,
                "waste_type_id": 1,
                "waste_name": "Washing Machine",
                "image": null,
                "description": "Large household appliance for washing clothes"
            },
            {
                "waste_id": 2,
                "waste_type_id": 2,
                "waste_name": "Hand Blender",
                "image": null,
                "description": "Compact blender for small-scale food preparation"
            },
            ...
         ],
      "pagination": {
        "total": 7,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
}
```

## Endpoint: Mencari Sampah Berdasarkan id
- GET: `/api/waste/:id`
- Response:
```json
{
  "data": [
    {
      "waste_id": 1,
      "waste_name": "Washing Machine",
      "image": null,
      "description": "Large household appliance for washing clothes",
      "waste_type": {
        "waste_type_id": 1,
        "waste_type_name": "Large_Household_Apllience",
        "image": null
      }
    }
  ]
}
```

## Endpoint: Melihat Semua Type Sampah
- GET: `/api/waste/types`
- Response:
```json
{
  "data": [
    {
      "waste_type_id": 1,
      "waste_type_name": "Large_Household_Apllience",
      "image": null
    },
    {
      "waste_type_id": 2,
      "waste_type_name": "Small_Household_Appliances",
      "image": null
    },
    ...
  ]
}
```

## Endpoint: Mencari Sampah Berdasarkan Nama
- GET: `/api/waste/search?name=Laptop`
- Response:
```json
{
  "data": [
    {
      "waste_id": 3,
      "waste_name": "Laptop",
      "point": 25,
      "waste_type_id": 3,
      "image": null,
      "description": "Portable computer device for work and entertainment",
      "created_at": "2024-11-03T14:26:36.000Z",
      "updated_at": "2024-11-03T14:26:36.000Z"
    }
  ]
}
```


## Endpoint: Melihat Sampah Berdasarkan ID
- GET: `/api/pickup/totals/:id`
- Response:
```json
{
    "data": [
        {
            "pickup_id": 1,
            "pickup_date": "2024-11-06T00:00:00.000Z",
            "pickup_address": "JL. ABCD",
            "pickup_status": "accepted",
            "dropbox_id": 1,
            "courier_id": 1,
            "community_id": 1,
            "management_id": null,
            "created_at": "2024-11-06T10:16:28.000Z",
            "updated_at": "2024-11-06T11:59:56.000Z"
        }
    ]
}
```

## Endpoint: Melihat Semua Lokasi Dropbox
- GET: `/api/dropbox`
- Response:
```json
{
  "data": [
    {
      "dropbox_id": 1,
      "name": "Dropbox 1",
      "address": "Jl. Example No.1",
      "district_address": "Bandung_Utara",
      "longitude": "106.845599",
      "latitude": "-6.208763",
      "capacity": 1,
      "status": "Available",
      "created_at": "2024-11-03T14:23:17.000Z",
      "updated_at": "2024-11-06T11:20:25.000Z"
    },
    {
      "dropbox_id": 2,
      "name": "Dropbox 2",
      "address": "Jl. Example No.2",
      "district_address": "Bandung_Selatan",
      "longitude": "106.8456",
      "latitude": "-6.208764",
      "capacity": 0,
      "status": "Available",
      "created_at": "2024-11-03T14:23:17.000Z",
      "updated_at": "2024-11-03T15:54:52.000Z"
    },
    ...
  ]
}
```