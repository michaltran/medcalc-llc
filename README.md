# MedCalc LLC – Hệ thống bảng kiểm y khoa

**Trung tâm Y tế khu vực Liên Chiểu**

Hệ thống công cụ tính toán y khoa nội bộ, lấy cảm hứng từ MDCalc, bản địa hóa tiếng Việt. Triển khai theo kiến trúc **Vercel (frontend + serverless API) + PostgreSQL** trên server vật lý.

---

## Kiến trúc triển khai

```
┌─────────────────────────────┐         ┌──────────────────────────┐
│  Vercel (cloud)             │         │  Server vật lý           │
│  ─ Frontend React (static)  │  HTTPS  │  ─ PostgreSQL 14+        │
│  ─ Serverless API (api/*)   │ ◄─────► │  ─ Public IP / Tunnel    │
│  ─ Edge cache               │   SSL   │                          │
└─────────────────────────────┘         └──────────────────────────┘
        ▲
        │ HTTPS
        │
   Bác sĩ / điều dưỡng (browser)
```

---

## Cấu trúc thư mục

```
medcalc-llc/
├── api/                          ← Vercel Serverless Functions
│   ├── _lib/
│   │   ├── db.js                 ← PostgreSQL pool (cached)
│   │   └── auth.js               ← JWT + CORS helpers
│   ├── auth/
│   │   ├── login.js              POST /api/auth/login
│   │   └── me.js                 GET  /api/auth/me
│   ├── patients/
│   │   ├── index.js              GET/POST /api/patients
│   │   └── [id].js               GET/PUT  /api/patients/:id
│   ├── history/
│   │   ├── index.js              GET/POST /api/history
│   │   └── [id].js               GET/DELETE /api/history/:id
│   ├── protocols/
│   │   ├── index.js              GET/POST /api/protocols
│   │   ├── [id].js               GET/PUT  /api/protocols/:id
│   │   └── by-calculator/
│   │       └── [calculator_id].js
│   └── health.js                 GET /api/health
├── backend/                      ← Express server (chạy local hoặc fallback)
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── initDb.js             ← Script init schema + seed
│       ├── middleware/auth.js
│       └── routes/
├── frontend/                     ← React + Vite
│   └── src/
│       ├── App.jsx
│       ├── calculators/          ← 7 calculators (declarative)
│       ├── components/
│       ├── pages/
│       └── ...
├── package.json                  ← Root deps cho Vercel
├── vercel.json                   ← Cấu hình routing/build
├── .env.example                  ← Mẫu env vars
└── .gitignore
```

---

## Bảng kiểm hiện có

### 🫀 Tim mạch
| ID | Tên | Mục đích |
|---|---|---|
| `cha2ds2-vasc` | CHA₂DS₂-VASc | Phân tầng nguy cơ đột quỵ – rung nhĩ |
| `has-bled` | HAS-BLED | Nguy cơ chảy máu khi chống đông |
| `grace` | GRACE 2.0 | Tiên lượng tử vong – HCMVC |
| `timi-nstemi` | TIMI Risk Score | NSTEMI/UA |

### 🧬 Nội tiết – Chuyển hóa
| ID | Tên | Mục đích |
|---|---|---|
| `egfr-ckd-epi` | eGFR CKD-EPI 2021 | Ước tính độ lọc cầu thận (race-free) |
| `bmi` | BMI | Phân loại WPRO Châu Á |
| `hba1c-eag` | HbA1c → eAG | Quy đổi đường huyết trung bình |

> Tham khảo: ESC 2024, KDIGO 2024, ADA 2024, NEJM, Chest, JAMA, WPRO.

---

## Tính năng

✅ Authentication JWT, phân quyền `admin`/`doctor`/`nurse`
✅ Quản lý hồ sơ bệnh nhân (CRUD, tìm kiếm)
✅ Lưu lịch sử tính toán theo bệnh nhân (JSONB lưu inputs + result)
✅ Phác đồ điều trị nội bộ (Markdown, gắn với từng bảng kiểm)
✅ In/xuất PDF qua `window.print()` với layout chuyên biệt cho hồ sơ bệnh án

---

# 🚀 Hướng dẫn Deploy

## Bước 1: Chuẩn bị PostgreSQL trên server

### 1.1. Tạo database và user

```sql
-- Đăng nhập postgres bằng tài khoản superuser
psql -U postgres

-- Tạo database
CREATE DATABASE medcalc_db;

-- Tạo user riêng (không dùng postgres user cho production)
CREATE USER medcalc_user WITH PASSWORD 'mật-khẩu-mạnh-đặt-ở-đây';

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE medcalc_db TO medcalc_user;

-- Cho user kết nối được
\c medcalc_db
GRANT ALL ON SCHEMA public TO medcalc_user;

\q
```

### 1.2. Cho phép kết nối từ xa

Sửa `pg_hba.conf` (thường ở `/etc/postgresql/14/main/` trên Linux hoặc `C:\Program Files\PostgreSQL\14\data\` trên Windows):

```conf
# Cho phép kết nối SSL từ Vercel (sẽ ràng buộc IP qua firewall)
hostssl  medcalc_db  medcalc_user  0.0.0.0/0  scram-sha-256
```

Sửa `postgresql.conf`:

```conf
listen_addresses = '*'
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

Restart PostgreSQL: `sudo systemctl restart postgresql` (Linux) hoặc qua Services (Windows).

### 1.3. Mở firewall port 5432

**Windows:**
```powershell
New-NetFirewallRule -DisplayName "PostgreSQL" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow
```

**Linux:**
```bash
sudo ufw allow 5432/tcp
```

> ⚠️ **Bảo mật**: Mở port 5432 ra Internet có rủi ro cao. Phương án an toàn hơn:
> - **Cloudflare Tunnel** hoặc **Tailscale**: tạo tunnel an toàn không cần mở port
> - **IP whitelist**: chỉ cho phép IP ranges của Vercel (Vercel không công bố IP cố định, nhưng có thể ràng buộc bằng firewall application-layer)

### 1.4. Init schema và seed data

Trên server có cài Node.js + git, clone repo và chạy:

```bash
git clone https://github.com/<your-org>/medcalc-llc.git
cd medcalc-llc/backend
npm install
cp .env.example .env
# Sửa .env với DATABASE_URL trỏ về localhost (chạy ngay trên DB server)
nano .env

npm run init-db
```

Output mong đợi:
```
✅ Connected to PostgreSQL
✅ Schema ready
✅ Created admin / admin@123
✅ Created bs.nguyenvan / bacsi@123
✅ Created bs.tranthi / bacsi@123
✅ Seeded 2 clinical protocols
```

> ⚠️ **Quan trọng**: Đăng nhập với `admin` rồi đổi mật khẩu ngay sau khi init xong.

---

## Bước 2: Deploy frontend + API lên Vercel

### 2.1. Push code lên GitHub

```bash
cd medcalc-llc
git init
git add .
git commit -m "Initial commit: MedCalc LLC for TTYT Liên Chiểu"
git remote add origin https://github.com/<your-org>/medcalc-llc.git
git branch -M main
git push -u origin main
```

> File `.env` đã được loại trong `.gitignore` — không được commit secrets.

### 2.2. Import vào Vercel

1. Vào [vercel.com/new](https://vercel.com/new)
2. **Import Git Repository** → chọn repo `medcalc-llc`
3. **Framework Preset**: `Other` (Vercel sẽ tự đọc `vercel.json`)
4. **Root Directory**: `.` (mặc định)
5. **Build & Output Settings**: Vercel tự đọc từ `vercel.json`, không cần đổi

### 2.3. Cấu hình Environment Variables

Vào **Project Settings → Environment Variables**, thêm các biến sau (cho cả Production, Preview, Development):

| Tên biến | Giá trị |
|----------|---------|
| `JWT_SECRET` | Chuỗi 64 hex random — tạo bằng `openssl rand -hex 32` |
| `DATABASE_URL` | `postgresql://medcalc_user:PASS@your-server.com:5432/medcalc_db?sslmode=require` |
| `PGSSL` | `true` |

Không cần đặt `PGHOST`/`PGPORT`/... nếu đã có `DATABASE_URL`.

### 2.4. Deploy

Click **Deploy**. Vercel sẽ:
1. Cài deps cả root (`pg`, `bcryptjs`, `jsonwebtoken`) và frontend
2. Build frontend → `frontend/dist`
3. Triển khai serverless functions từ thư mục `api/`
4. Cấu hình routing: `/api/*` → functions, `/*` → static frontend

Sau khi deploy xong, anh/chị sẽ có URL dạng `https://medcalc-llc.vercel.app`.

### 2.5. Test deployment

```bash
# Health check (kiểm tra DB connection từ Vercel)
curl https://medcalc-llc.vercel.app/api/health

# Login
curl -X POST https://medcalc-llc.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@123"}'
```

Nếu `/api/health` báo `db_connected: true` thì kết nối DB OK.

### 2.6. Cấu hình custom domain (tùy chọn)

Trong Vercel: **Settings → Domains** → thêm domain của Trung tâm (vd: `medcalc.ttyt-lienchieu.gov.vn`). Vercel tự cấp HTTPS qua Let's Encrypt.

---

## Quy trình cập nhật code

```bash
# Trên máy dev
git add .
git commit -m "Cập nhật: thêm bảng kiểm Wells Score"
git push

# Vercel tự động rebuild và deploy khi có push lên main
```

Nếu sửa schema database, chạy lại trên server:
```bash
cd backend && npm run init-db   # script idempotent, không xóa data cũ
```

---

## Troubleshooting

### "db_connected: false" trên `/api/health`

1. **Kiểm tra `DATABASE_URL` trong Vercel env** có đúng format không
2. **Test kết nối từ máy ngoài** đến PostgreSQL:
   ```bash
   psql "postgresql://medcalc_user:PASS@your-server.com:5432/medcalc_db?sslmode=require"
   ```
3. **Kiểm tra `pg_hba.conf`** có cho phép kết nối từ IP của Vercel không
4. **Kiểm tra firewall** port 5432 có mở không
5. **Vercel logs**: Project → Deployments → chọn deployment → Functions → xem error logs

### Frontend trắng / lỗi 404 ở route nội bộ

Kiểm tra `vercel.json` có rule `{ "source": "/(.*)", "destination": "/index.html" }` để SPA routing hoạt động.

### Lỗi CORS

API đã set CORS `*` trong `_lib/auth.js`. Nếu deploy frontend ở domain khác Vercel, kiểm tra trình duyệt console.

### "Cannot find module 'pg'" khi deploy

Đảm bảo `package.json` ở root có `pg` trong `dependencies`. Vercel cài deps từ root cho serverless functions.

---

## Bảo mật & Tuân thủ

⚠️ **Lưu ý quan trọng cho cơ sở y tế Việt Nam**:

1. **Nghị định 13/2023/NĐ-CP về dữ liệu cá nhân**: Vercel host frontend ở US/EU. Mặc dù dữ liệu DB nằm ở server Việt Nam, request đi qua Vercel có thể bị xem là "chuyển dữ liệu xuyên biên giới". Cần tham vấn pháp chế.
2. **Thông tư 54/2017/TT-BYT** về CNTT y tế: Yêu cầu đảm bảo bảo mật, sao lưu, audit.
3. **Khuyến cáo**:
   - Bật HTTPS bắt buộc (Vercel tự động)
   - JWT secret ≥ 32 bytes random
   - Đổi tất cả mật khẩu mặc định ngay sau init
   - Backup DB hàng đêm (`pg_dump`)
   - Audit log: hệ thống đã ghi `user_id` + `created_at` cho mọi calculation
   - Cân nhắc deploy frontend trên VPS Việt Nam (Viettel Cloud, FPT Cloud) thay vì Vercel nếu pháp chế yêu cầu

---

## Roadmap đề xuất (giai đoạn 2)

- [ ] Bộ bảng kiểm mở rộng: qSOFA, GCS, Apgar, Bishop, Padua VTE Risk, ASCVD
- [ ] 2FA cho tài khoản admin
- [ ] Tích hợp HIS/LIS qua HL7 FHIR
- [ ] Module thống kê: phân bố nguy cơ theo khoa, xu hướng theo thời gian
- [ ] Export Excel cho báo cáo định kỳ
- [ ] So sánh kết quả qua các lần khám của cùng bệnh nhân
- [ ] Audit log chi tiết (truy cập hồ sơ, đăng nhập thất bại)

---

## Tham khảo

- ESC Guidelines for Atrial Fibrillation 2024
- ESC Guidelines for ACS 2023
- KDIGO Clinical Practice Guideline for CKD 2024
- ADA Standards of Medical Care in Diabetes 2024
- WHO/WPRO Asia-Pacific BMI Classification 2000
- NKF-ASN Task Force on Race-Free eGFR (2021)

---

*Phát triển bởi đội ngũ CNTT – Trung tâm Y tế khu vực Liên Chiểu, 2025.*
