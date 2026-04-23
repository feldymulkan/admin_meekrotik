# 🚀 Mikhmon Admin System

Sistem manajemen admin modern untuk Mikhmon-Fast dengan backend Rust dan frontend React. Sistem ini telah dioptimasi untuk keamanan tinggi dan performa skala besar.

## ✨ Fitur Baru & Optimasi

- **🛡️ Two-Factor Authentication (2FA)**: Login super aman menggunakan Google Authenticator/Authy.
- **⚙️ Admin Settings**: Halaman khusus untuk reset password dan aktivasi/deaktivasi 2FA.
- **⚡ High-Performance Background Worker**: Pembersihan otomatis user expired setiap 24 jam tanpa membebani server.
- **🏎️ Database Connection Pooling**: Optimasi koneksi MySQL (Admin DB & Mikhmon DB) untuk menangani trafik tinggi.
- **🔐 Security Hardening**: Menghapus potensi crash server (Denial of Service) dengan error handling yang ketat.
- **🐳 Dockerized**: Deployment instan menggunakan Docker & Docker Compose.

---

## 🌐 Deployment di VPS dengan Nginx Reverse Proxy (Recommended)

Jika Anda memiliki VPS yang sudah terinstall Nginx, ikuti langkah ini agar sistem aman dan menggunakan HTTPS:

### 1. Jalankan Docker

Pastikan `docker-compose.yml` menggunakan binding `127.0.0.1` (sudah diatur secara default).

```bash
docker-compose up -d --build
```

### 2. Konfigurasi Nginx VPS

Salin isi dari file `vps-nginx.conf` ke konfigurasi Nginx VPS Anda:

```bash
sudo cp vps-nginx.conf /etc/nginx/sites-available/mikhmon-admin
sudo ln -s /etc/nginx/sites-available/mikhmon-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Pasang SSL (HTTPS)

Gunakan Certbot untuk mengamankan koneksi:

```bash
sudo certbot --nginx -d domain-anda.com
```

---

### 1. Persiapan Environment

Pastikan file `.env` sudah terisi dengan benar di root direktori:

```env
DATABASE_URL=mysql://user:pass@host/admin_db
MIKHMON_DATABASE_URL=mysql://user:pass@host/mikhmon_db
JWT_SECRET=rahasia_super_kuat
FRONTEND_URL=http://localhost:8089
```

### 2. Migrasi Database Mikhmon-Fast

Agar fitur *Expired Date* dan *Created Date* berfungsi, Anda perlu menambahkan kolom berikut ke tabel `users` di database **Mikhmon-Fast** Anda:

```sql
/* Jalankan ini di database mikhmon_db Anda */
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_date VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS expired_date VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active TINYINT(1) DEFAULT 1;
```

### 3. Jalankan Sistem

Gunakan perintah berikut untuk membangun dan menjalankan seluruh layanan:

```bash
docker-compose up -d --build
```

- **Frontend**: Akses di `http://localhost:8089`
- **Backend API**: Berjalan di `http://localhost:8080`

---

## 🛠️ Penggunaan Fitur 2FA

1. **Aktivasi**:
   - Login ke Dashboard.
   - Buka menu **Settings** di sidebar.
   - Klik **Enable 2FA**.
   - Scan QR Code yang muncul menggunakan aplikasi **Google Authenticator** di HP Anda.
   - Masukkan kode 6 digit untuk konfirmasi.
2. **Login dengan 2FA**:
   - Setelah aktif, setiap login akan meminta kode 6 digit dari HP Anda setelah memasukkan password.
3. **Reset/Disable**:
   - Anda dapat menonaktifkan 2FA kapan saja di halaman Settings dengan memasukkan password konfirmasi.

---

## 🚀 Optimasi Performa & Keamanan yang Dilakukan

### 1. Keamanan (Security)

- **Safe Error Handling**: Mengganti semua fungsi `.unwrap()` di Rust yang berisiko membuat server _crash_ jika database bermasalah.
- **Input Validation**: Validasi ketat pada username (alphanumeric only) dan panjang karakter untuk mencegah serangan injeksi atau overload data.

### 2. Performa (Performance)

- **State Management Optimization**: Frontend tidak lagi men-download ulang seluruh data user setiap kali ada perubahan (Edit/Delete). UI akan mengupdate data secara lokal secara instan.
- **Connection Limits**: Membatasi koneksi database agar tidak terjadi _resource exhaustion_ (kehabisan RAM) saat banyak user mengakses secara bersamaan.

---

## 👨‍💻 Pengembangan Lokal (Tanpa Docker)

**Backend (Rust):**

```bash
cargo run
```

**Frontend (React):**

```bash
cd ui
npm install
npm run dev
```

---

_Dikembangkan dengan ❤️ untuk ekosistem Mikhmon yang lebih cepat dan aman._
