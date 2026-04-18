# Mikhmon Admin API (Rust Version)

Modul API Admin berbasis Rust yang didesain untuk performa tinggi dalam mengelola user sistem Mikhmon-Fast. Menggunakan Axum sebagai web framework dan SeaORM untuk interaksi database.

## Fitur Utama
- **High Performance**: Dibangun dengan Rust untuk eksekusi yang sangat cepat.
- **Dual Database Architecture**: 
  - `admin_db`: Untuk autentikasi akses ke API ini.
  - `mikhmon`: Untuk manajemen data user Mikhmon-Fast.
- **JWT Authentication**: Keamanan akses menggunakan JSON Web Token.
- **Full CRUD**: Tambah, Edit, Hapus, dan Toggle status user Mikhmon menggunakan `unique_id`.

## Persiapan Environment
Buat atau edit file `.env` di folder root:

```env
# Database Admin (Untuk Login API)
DATABASE_URL=mysql://pepadu:pepadu@localhost:3306/admin_db

# Database Mikhmon (Yang dikelola)
MIKHMON_DATABASE_URL=mysql://mikhmon_user:mikhmon_pass123@localhost:3306/mikhmon

# Konfigurasi Server
HOST=0.0.0.0
PORT=8085

# Security
JWT_SECRET=GantiDenganSecretKeyYangSangatPanjangDanAcak123!
```

## Cara Menjalankan
1. Pastikan database MySQL berjalan.
2. Jalankan aplikasi:
   ```bash
   cargo run
   ```

---

## API Reference & Panduan Tes (CURL)

### 1. Login Admin
Gunakan ini untuk mendapatkan Token JWT.
- **Username**: `admin`
- **Password**: `admin123`

```bash
curl -i -X POST http://localhost:8085/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "admin123"}'
```

### 2. List User Mikhmon
Melihat semua user yang terdaftar di database Mikhmon.

```bash
curl -i -X GET http://localhost:8085/api/users \
     -H "Authorization: Bearer <TOKEN_ANDA>"
```

### 3. Tambah User Mikhmon Baru
Menambah user baru ke dalam database Mikhmon-Fast.

```bash
curl -i -X POST http://localhost:8085/api/users \
     -H "Authorization: Bearer <TOKEN_ANDA>" \
     -H "Content-Type: application/json" \
     -d '{
       "username": "user_baru",
       "password": "password123"
     }'
```

> **Note**: Field `unique_id` akan digenerate otomatis secara random, sedangkan `theme` (light) dan `lang` (id) akan diatur menggunakan nilai default jika tidak dikirim dalam request.

### 4. Update User Mikhmon
Mengubah data user menggunakan **unique_id**.

```bash
curl -i -X PUT http://localhost:8085/api/users/router_01 \
     -H "Authorization: Bearer <TOKEN_ANDA>" \
     -H "Content-Type: application/json" \
     -d '{
       "theme": "dark",
       "themecolor": "#20a8d8"
     }'
```

### 5. Toggle Status User (Aktif/Non-aktif)
Mengaktifkan atau menonaktifkan user menggunakan **unique_id**.

```bash
curl -i -X PATCH http://localhost:8085/api/users/router_01/toggle \
     -H "Authorization: Bearer <TOKEN_ANDA>"
```

### 6. Hapus User Mikhmon
Menghapus user secara permanen menggunakan **unique_id**.

```bash
curl -i -X DELETE http://localhost:8085/api/users/router_01 \
     -H "Authorization: Bearer <TOKEN_ANDA>"
```

---

## Troubleshooting
- **Address already in use**: Jika muncul error port terpakai, jalankan `pkill -9 admin`.
- **Invalid Credentials**: Pastikan password di database sesuai. Gunakan `admin123` untuk login awal.
- **Database Error**: Pastikan user MySQL memiliki izin akses ke database `admin_db` dan `mikhmon`.
