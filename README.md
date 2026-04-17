# 🛡️ Mikhmon Admin API (Rust Version)

Backend API berperformansi tinggi untuk manajemen pengguna admin menggunakan **Rust**, **Axum**, dan **SeaORM**.

## 🚀 Teknologi yang Digunakan
- **Rust (Edition 2024)**: Bahasa pemrograman dengan keamanan memori dan kecepatan ekstrim.
- **Axum**: Web framework modular berbasis Tokio.
- **SeaORM**: ORM async untuk manajemen database yang modern.
- **Tokio**: Runtime asynchronous untuk I/O non-blocking.
- **Bcrypt**: Keamanan password tingkat tinggi.

---

## 💾 Persiapan Database (MySQL)

Gunakan skrip berikut atau jalankan file `init.sql` untuk menyiapkan tabel:

```sql
CREATE DATABASE admin_db;
USE admin_db;

CREATE TABLE `admin_users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(255) NOT NULL,
    `password_hash` varchar(255) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 🏗️ Alur & Arsitektur Program

Program ini mengikuti pola **MVC-ish / Layered Architecture**:

### 1. Inisialisasi (**main.rs**)
- Aplikasi memuat variabel lingkungan dari `.env`.
- Menyiapkan **Database Connection Pool** (SeaORM).
- Mengaktifkan **Tracing** untuk logging/debug.
- Menginisialisasi `AppState` yang akan di-share ke setiap handler.

### 2. Autentikasi (**auth.rs**)
- **Flow**: User mengirim `username` & `password` -> API mencari user di DB -> Memvalidasi `is_active` -> Memverifikasi `password` dengan hashing salt `bcrypt` -> Response sukses (dengan mock JWT token).

### 3. Manajemen User (**users.rs**)
- **CRUD Operations**: Menggunakan pola *ActiveModel* SeaORM untuk memastikan perubahan data tersinkronisasi dengan baik ke database.
- **Aksi Cepat**: Dilengkapi dengan endpoint `patch` untuk toggle status aktif/nonaktif user secara instan tanpa membebani server.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Login admin (username & password) |
| `GET` | `/api/users` | Mengambil semua daftar admin |
| `POST` | `/api/users` | Menambahkan admin baru |
| `PUT` | `/api/users/:id` | Mengupdate data admin |
| `DELETE` | `/api/users/:id` | Menghapus admin secara permanen |
| `PATCH` | `/api/users/:id/toggle` | Mengubah status aktif/nonaktif |

---

## 🛠️ Cara Menjalankan

### Persiapan Linker (PENTING)
Pastikan sistem Anda sudah memiliki `gcc` terinstal (diperlukan oleh library `bcrypt` dan driver MySQL):
```bash
sudo apt update && sudo apt install -y gcc
```

### Konfigurasi Environment
Salin template `.env` dan sesuaikan kredensial database Anda:
```bash
cp .env.example .env
```

### Kompilasi & Jalankan
```bash
cargo run
```

---

## 📂 Struktur Folder
- `src/main.rs`: Entry point & Server Setup.
- `src/entities/`: Definisi model database (SeaORM).
- `src/routes/`: Logika handler untuk setiap endpoint API.
- `src/routes/auth.rs`: Logika login & keamanan.
- `src/routes/users.rs`: Logika manajemen pengguna.
