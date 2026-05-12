# Panduan Deployment VPS - Mikhmon Admin & Port Forwarding Manager

Dokumen ini menjelaskan langkah-langkah untuk mendeploy aplikasi ke VPS. Metode yang direkomendasikan adalah menggunakan **Docker Compose** untuk kemudahan manajemen dependensi.

---

## 📋 Persyaratan Sistem
- VPS dengan OS Linux (Ubuntu 20.04/22.04 direkomendasikan).
- Akses Root atau user dengan hak akses Sudo.
- Domain yang sudah diarahkan (A Record) ke IP VPS.
- Docker & Docker Compose terinstal.

### Install Docker & Docker Compose (Jika belum ada)
```bash
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable --now docker
```

---

## 🚀 Metode 1: Deployment dengan Docker Compose (Direkomendasikan)

Metode ini akan menjalankan 3 container:
1. `backend`: Rust API (Port 8080)
2. `frontend`: React SPA dengan Nginx internal (Port 8089)
3. `db`: MySQL 8.0 (Port 3307 internal)

### Langkah-langkah:

1.  **Upload Source Code** ke VPS menggunakan Git atau SCP.
2.  **Konfigurasi Environment:**
    Salin file `.env.example` menjadi `.env` dan sesuaikan nilainya.
    ```bash
    cp .env.example .env
    nano .env
    ```
    Sesuaikan variabel berikut:
    - `DATABASE_URL=mysql://pepadu:pepadu@db:3306/admin_db` (Gunakan `db` sebagai host).
    - `JWT_SECRET`: Ganti dengan string acak yang panjang.
    - `ADMIN_USERNAME` & `ADMIN_PASSWORD`: Kredensial awal login.
    - `FRONTEND_URL`: `https://domain-anda.com`

3.  **Jalankan Container:**
    ```bash
    sudo docker-compose up -d --build
    ```

4.  **Verifikasi:**
    Cek apakah semua container berjalan:
    ```bash
    sudo docker ps
    ```

---

## 🌐 Metode 2: Deployment Manual (Tanpa Docker)

Gunakan metode ini jika Anda ingin kontrol penuh atas OS atau resource VPS terbatas.

### 1. Build Backend (Rust)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Build
cargo build --release
# Hasil binary: target/release/admin
```

### 2. Build Frontend (React)
```bash
cd ui
npm install
npm run build
# Hasil build: ui/dist
```

### 3. Setup Systemd Service (Backend)
Buat file `/etc/systemd/system/mikhmon-admin.service`:
```ini
[Unit]
Description=Mikhmon Admin Backend
After=network.target

[Service]
User=root
WorkingDirectory=/path/to/project
ExecStart=/path/to/project/target/release/admin
Restart=always
EnvironmentFile=/path/to/project/.env

[Install]
WantedBy=multi-user.target
```
Jalankan: `sudo systemctl enable --now mikhmon-admin`

---

## 🔒 Konfigurasi Nginx & SSL (Reverse Proxy)

Agar aplikasi dapat diakses melalui domain dengan HTTPS.

1.  **Install Nginx & Certbot:**
    ```bash
    sudo apt install nginx python3-certbot-nginx -y
    ```

2.  **Konfigurasi Site:**
    Buat file `/etc/nginx/sites-available/mikhmon-admin`:
    ```nginx
    server {
        listen 80;
        server_name domain-anda.com;

        location / {
            proxy_pass http://127.0.0.1:8089; # Port Frontend (Docker)
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Opsional: Jika manual tanpa docker, arahkan / langsung ke ui/dist
        # location / {
        #     root /path/to/project/ui/dist;
        #     try_files $uri $uri/ /index.html;
        # }
    }
    ```

3.  **Aktifkan Konfigurasi:**
    ```bash
    sudo ln -s /etc/nginx/sites-available/mikhmon-admin /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

4.  **Install SSL Certificate:**
    ```bash
    sudo certbot --nginx -d domain-anda.com
    ```

---

## 🛡️ Keamanan & Pemeliharaan

1.  **Firewall (iptables):**
    Jika Anda menggunakan `iptables`, pastikan port 80 (HTTP), 443 (HTTPS), dan 22 (SSH) terbuka.
    ```bash
    # Izinkan SSH
    sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    
    # Izinkan HTTP & HTTPS
    sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    
    # Izinkan traffic loopback
    sudo iptables -A INPUT -i lo -j ACCEPT
    
    # Izinkan koneksi yang sudah established
    sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    
    # Drop traffic lainnya (Opsional - Hati-hati jangan sampai terkunci)
    # sudo iptables -P INPUT DROP
    ```
    Pastikan untuk menyimpan aturan agar tidak hilang saat reboot:
    ```bash
    sudo apt install iptables-persistent
    sudo netfilter-persistent save
    ```

2.  **Iptables & Port Forwarding:**
    Backend aplikasi ini akan memanipulasi tabel `nat` pada `iptables` untuk fitur Port Forwarding. 
    - **Docker:** Sudah otomatis mendapatkan izin melalui `cap_add: - NET_ADMIN`.
    - **Manual:** User yang menjalankan aplikasi harus memiliki akses sudo ke `/usr/sbin/iptables` tanpa password.

3.  **Update Aplikasi:**
    Jika ada perubahan kode:
    ```bash
    git pull
    sudo docker-compose up -d --build
    ```

---
*Dokumentasi ini dibuat pada: 12 Mei 2026*
