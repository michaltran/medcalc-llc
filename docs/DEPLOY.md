# Hướng dẫn Deploy nhanh – MedCalc LLC

## Mô hình
```
GitHub repo  ──push──► Vercel (auto-build)
                          │
                          │ HTTPS API call
                          ▼
                    PostgreSQL (server vật lý TTYT)
```

---

## Phần 1: Setup PostgreSQL trên server vật lý

> Chỉ cần làm 1 lần duy nhất.

### 1.1. Tạo database (Windows)

Mở **SQL Shell (psql)** từ Start Menu, đăng nhập `postgres` user:

```sql
CREATE DATABASE medcalc_db;
CREATE USER medcalc_user WITH PASSWORD 'mật-khẩu-rất-mạnh-ở-đây';
GRANT ALL PRIVILEGES ON DATABASE medcalc_db TO medcalc_user;
\c medcalc_db
GRANT ALL ON SCHEMA public TO medcalc_user;
\q
```

### 1.2. Cho phép kết nối từ Internet (Vercel)

**File 1**: `C:\Program Files\PostgreSQL\<version>\data\postgresql.conf`

Sửa dòng:
```conf
listen_addresses = '*'
ssl = on
```

**File 2**: `C:\Program Files\PostgreSQL\<version>\data\pg_hba.conf`

Thêm dòng cuối file:
```conf
hostssl  medcalc_db  medcalc_user  0.0.0.0/0  scram-sha-256
```

**Restart PostgreSQL service**: Win + R → `services.msc` → tìm `postgresql-x64-<version>` → Restart.

### 1.3. Mở firewall Windows

Mở **PowerShell as Administrator**:
```powershell
New-NetFirewallRule -DisplayName "PostgreSQL Inbound" `
  -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

### 1.4. Setup SSL certificate

PostgreSQL cần cert để bật SSL. Hai phương án:

**A) Self-signed (đơn giản, dùng cho LAN/test):**

Trong thư mục `data/` của PostgreSQL:
```powershell
# Cần OpenSSL (cài qua Chocolatey: choco install openssl)
openssl req -new -x509 -days 365 -nodes -text -out server.crt -keyout server.key -subj "/CN=medcalc-db"
icacls server.key /inheritance:r /grant:r "NT SERVICE\postgresql-x64-14:R"
```

**B) Let's Encrypt (nếu có domain):**

Dùng [win-acme](https://www.win-acme.com/) để cấp cert tự động.

### 1.5. Init schema và seed data

```powershell
cd C:\path\to\medcalc-llc\backend
npm install
copy .env.example .env
notepad .env
```

Nội dung `.env`:
```env
DATABASE_URL=postgresql://medcalc_user:PASS@localhost:5432/medcalc_db
JWT_SECRET=tạm-thời-không-dùng-ở-server-vì-chỉ-init-db
PGSSL=false
```

Chạy:
```powershell
npm run init-db
```

Kỳ vọng output:
```
✅ Connected to PostgreSQL
✅ Schema ready
✅ Created admin / admin@123
✅ Seeded 2 clinical protocols
```

---

## Phần 2: Push code lên GitHub

```powershell
cd C:\path\to\medcalc-llc
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<your-org>/medcalc-llc.git
git branch -M main
git push -u origin main
```

> Kiểm tra `.gitignore` đã loại `.env` chưa — KHÔNG bao giờ push file `.env`.

---

## Phần 3: Deploy lên Vercel

### 3.1. Import project

1. Đăng nhập [vercel.com](https://vercel.com)
2. **Add New** → **Project** → chọn repo `medcalc-llc`
3. **Framework Preset**: Other
4. **Root Directory**: `.` (giữ mặc định)
5. **Install Command**, **Build Command**, **Output Directory**: Giữ trống — Vercel đọc từ `vercel.json`

### 3.2. Environment Variables

**Project Settings → Environment Variables** → thêm:

| Key | Value | Apply to |
|-----|-------|----------|
| `JWT_SECRET` | (chạy `openssl rand -hex 32` trên Linux/Mac, hoặc dùng [random.org/strings](https://www.random.org)) | Production, Preview, Development |
| `DATABASE_URL` | `postgresql://medcalc_user:PASS@PUBLIC_IP_HOẶC_DOMAIN:5432/medcalc_db` | Production, Preview |
| `PGSSL` | `true` | Production, Preview |

> `DATABASE_URL`: phải dùng **public IP hoặc domain** của server PostgreSQL — Vercel không kết nối được vào IP nội bộ (192.168.x.x, 10.x.x.x).

### 3.3. Deploy

Click **Deploy**. Vercel sẽ build trong 1-2 phút.

### 3.4. Verify

Mở trình duyệt:
```
https://medcalc-llc-<random>.vercel.app/api/health
```

Phản hồi mong đợi:
```json
{
  "status": "ok",
  "db_connected": true,
  "timestamp": "..."
}
```

Nếu `db_connected: false` → xem [Troubleshooting](#troubleshooting).

### 3.5. Đăng nhập lần đầu

Truy cập domain Vercel → đăng nhập:
- Username: `admin`
- Password: `admin@123`

**Đổi mật khẩu ngay** sau khi đăng nhập (chức năng này nên thêm trong giai đoạn 2 — hiện tại có thể đổi trực tiếp trong DB):

```sql
-- Tạo hash mới: trong file backend, chạy:
node -e "console.log(require('bcryptjs').hashSync('mat-khau-moi', 10))"

-- Update vào DB:
UPDATE users SET password_hash = '$2a$10$...' WHERE username = 'admin';
```

---

## Phần 4: Quy trình cập nhật code

```powershell
# Sửa code → commit → push
git add .
git commit -m "Mô tả thay đổi"
git push
```

Vercel tự động:
1. Nhận webhook từ GitHub
2. Build lại frontend + redeploy serverless functions
3. Trang web mới live trong ~1-2 phút

Không cần làm gì trên server PostgreSQL **trừ khi** sửa schema. Nếu sửa schema:
```powershell
cd C:\path\to\medcalc-llc
git pull
cd backend
npm run init-db
```

---

## Troubleshooting

### "db_connected": false hoặc lỗi ECONNREFUSED

**Nguyên nhân**: Vercel không kết nối được PostgreSQL.

**Kiểm tra theo thứ tự**:

1. **Test từ máy bên ngoài** mạng nội bộ:
   ```bash
   psql "postgresql://medcalc_user:PASS@PUBLIC_IP:5432/medcalc_db?sslmode=require"
   ```
   Nếu cũng lỗi → vấn đề ở server, không phải Vercel.

2. **Server có public IP không?** Nhiều mạng bệnh viện dùng NAT, server không reach được từ Internet. Hỏi IT về:
   - IP công cộng của Trung tâm
   - Có port forwarding 5432 từ router → server không?

3. **Firewall Windows**: kiểm tra rule đã tạo
   ```powershell
   Get-NetFirewallRule -DisplayName "PostgreSQL Inbound"
   ```

4. **PostgreSQL listening**: chạy trên server
   ```powershell
   netstat -an | findstr :5432
   ```
   Nếu chỉ thấy `127.0.0.1:5432` → `listen_addresses` chưa đúng.

5. **`pg_hba.conf`** đã có dòng `hostssl ... 0.0.0.0/0` chưa? Đã restart service chưa?

### Vercel build fail

Xem **Deployments → click vào deployment → Build Logs**.

Lỗi thường gặp:
- `Cannot find module 'pg'`: `package.json` ở root thiếu deps. Đã có sẵn trong file root `package.json`.
- `Build command failed`: lỗi React. Test local trước:
  ```powershell
  cd frontend
  npm install
  npm run build
  ```

### Lỗi 500 khi gọi API

Xem **Vercel Dashboard → Project → Logs** (real-time).

Lỗi thường gặp:
- `JWT_SECRET undefined` → quên set env var
- `password authentication failed` → sai mật khẩu trong `DATABASE_URL`
- `permission denied for table users` → user thiếu quyền: chạy lại `GRANT ALL ON SCHEMA public TO medcalc_user;`

---

## Bảo mật bổ sung (khuyến cáo mạnh)

### Cloudflare Tunnel thay cho mở port 5432

An toàn hơn nhiều so với mở 5432 ra Internet:

1. Cài [cloudflared](https://github.com/cloudflare/cloudflared) trên server PostgreSQL
2. Tạo tunnel: `cloudflared tunnel create medcalc-db`
3. Cấu hình route: `cloudflared tunnel route dns medcalc-db medcalc-db.your-domain.com`
4. Tunnel forward TCP 5432 → endpoint Cloudflare
5. Trong Vercel `DATABASE_URL`, dùng hostname của tunnel thay vì IP server

Lợi ích:
- Không phải mở port public
- Cloudflare cấp HTTPS/TLS
- Có DDoS protection
- Có thể bật Cloudflare Access để giới hạn IP/team

### Backup DB hàng ngày

Tạo Task Scheduler job trên Windows server:

```powershell
# backup.ps1
$date = Get-Date -Format "yyyy-MM-dd"
& "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" `
  -U medcalc_user -d medcalc_db `
  -f "D:\backups\medcalc_$date.sql"

# Xóa backup cũ hơn 30 ngày
Get-ChildItem D:\backups\medcalc_*.sql | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | Remove-Item
```

Lên lịch: `taskschd.msc` → Create Task → chạy daily lúc 02:00.
