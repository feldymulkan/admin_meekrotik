# Deployment Guide: Mikhmon Admin

Panduan ini menjelaskan langkah-langkah untuk mendeploy aplikasi Mikhmon Admin ke lingkungan produksi (VPS/Server Linux).

## 1. Persyaratan Sistem
Pastikan server Anda memiliki komponen berikut:
- **Rust Toolchain**: `rustc`, `cargo` (Versi terbaru disarankan).
- **Node.js & npm**: Untuk membangun frontend.
- **MySQL/MariaDB**: Database server.
- **Nginx**: Sebagai reverse proxy (direkomendasikan).

## 2. Persiapan Database
Aplikasi ini menggunakan dua database terpisah.
1. Masuk ke MySQL: `mysql -u root -p`
2. Eksekusi script inisialisasi:
   ```bash
   mysql -u user -p < init.sql
   ```
3. Pastikan database `admin_db` telah dibuat dan tabel `admin_users` terisi.
4. Pastikan Anda memiliki akses ke database Mikhmon-Fast yang ingin dikelola.

## 3. Konfigurasi Environment
Buat file `.env` di direktori root server:
```env
# Database Admin
DATABASE_URL=mysql://user:pass@localhost:3306/admin_db

# Database Mikhmon
MIKHMON_DATABASE_URL=mysql://user:pass@localhost:3306/mikhmon

# Konfigurasi Server
HOST=127.0.0.1
PORT=8080
FRONTEND_URL=https://mikhmon-admin.example.com

# Keamanan
JWT_SECRET=Gunakan_String_Acak_Dan_Sangat_Panjang_Di_Sini_!
```

## 4. Build Backend (Rust)
Kompilasi backend ke dalam binary produksi:
```bash
cargo build --release
```
Binary hasil build akan berada di `target/release/admin`.

## 5. Build Frontend (React)
Bangun aset statis untuk frontend:
```bash
cd ui
npm install
npm run build
```
Hasil build akan berada di folder `ui/dist`.

## 6. Menjalankan Aplikasi

### Opsi A: Menggunakan Systemd (Rekomendasi)
Buat file service `/etc/systemd/system/mikhmon-admin.service`:
```ini
[Unit]
Description=Mikhmon Admin Backend
After=network.target mysql.service

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/mikhmon-admin
ExecStart=/path/to/mikhmon-admin/target/release/admin
Restart=always
EnvironmentFile=/path/to/mikhmon-admin/.env

[Install]
WantedBy=multi-user.target
```
Jalankan service:
```bash
sudo systemctl enable mikhmon-admin
sudo systemctl start mikhmon-admin
```

## 7. Konfigurasi Nginx (Reverse Proxy)
Konfigurasikan Nginx untuk melayani frontend dan mem-proxy API ke backend.

```nginx
server {
    listen 80;
    server_name mikhmon-admin.example.com;

    # Root folder untuk Frontend build
    root /path/to/mikhmon-admin/ui/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy ke Backend API
    location /api {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 8. Optimalisasi Keamanan Produksi
- **SSL/TLS**: Selalu gunakan HTTPS (Certbot/Let's Encrypt).
- **Firewall**: Tutup port 8080 dan hanya buka port 80/443.
- **JWT Secret**: Pastikan `JWT_SECRET` sangat kuat dan unik untuk setiap instalasi.
- **Database**: Gunakan user database dengan hak akses terbatas (hanya ke database yang diperlukan).
