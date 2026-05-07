# MedCalc LLC – Hệ thống bảng kiểm y khoa

**Trung tâm Y tế khu vực Liên Chiểu**

Hệ thống nội bộ cung cấp các bảng kiểm và công cụ tính toán y khoa, lấy cảm hứng từ MDCalc và bản địa hóa hoàn toàn tiếng Việt. Tích hợp các tính năng quan trọng cho cơ sở y tế: quản lý hồ sơ bệnh nhân, lưu lịch sử tính toán, xuất kết quả PDF/in, và phác đồ điều trị nội bộ.

---

## Kiến trúc

```
medcalc-llc/
├── backend/              # Node.js + Express + SQLite
│   ├── src/
│   │   ├── server.js
│   │   ├── db.js
│   │   ├── initDb.js     # Khởi tạo schema + seed data
│   │   ├── middleware/
│   │   │   └── auth.js   # JWT authentication
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── patients.js
│   │       ├── history.js
│   │       └── protocols.js
│   └── data/             # SQLite database (auto-created)
└── frontend/             # React + Vite
    └── src/
        ├── App.jsx
        ├── calculators/  # Định nghĩa các bảng kiểm (thuần JS, dễ mở rộng)
        │   ├── cha2ds2vasc.js
        │   ├── hasbled.js
        │   ├── grace.js
        │   ├── timi.js
        │   ├── egfr.js
        │   ├── bmi.js
        │   └── hba1c.js
        ├── components/
        ├── context/
        ├── pages/
        └── utils/
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
| `egfr-ckd-epi` | eGFR CKD-EPI 2021 | Ước tính độ lọc cầu thận |
| `bmi` | BMI | Phân loại WPRO Châu Á |
| `hba1c-eag` | HbA1c → eAG | Quy đổi đường huyết trung bình |

> Tham khảo từ các nguồn: ESC Guidelines 2023–2024, KDIGO 2024, ADA 2024, WHO/WPRO, NEJM, Chest, JAMA, Arch Intern Med.

---

## Tính năng chính

✅ **Authentication** – Phân quyền 3 vai trò: `admin`, `doctor`, `nurse`
✅ **Quản lý bệnh nhân** – Tìm kiếm, tạo mới, xem hồ sơ
✅ **Lịch sử tính toán** – Lưu theo bệnh nhân, có thể truy xuất
✅ **Phác đồ nội bộ** – Markdown, gắn với từng bảng kiểm, admin chỉnh sửa
✅ **In / xuất PDF** – Layout in chuyên nghiệp cho hồ sơ bệnh án
✅ **Print-friendly** – Sử dụng `window.print()` → "Save as PDF"

---

## Khởi động

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env       # Chỉnh JWT_SECRET trong production!
npm run init-db            # Tạo database + seed users
npm start                  # http://localhost:4000
```

> **Ghi chú về SQLite driver**: Hệ thống ưu tiên dùng `better-sqlite3` (hiệu năng cao). Nếu môi trường không build được native module (thiếu Python/build-tools), backend tự động fallback sang `node:sqlite` built-in (Node.js 22+). Production khuyến nghị Node 20 LTS + `better-sqlite3`; chỉ cần `apt install python3 build-essential` trên server Ubuntu là đủ.

**Tài khoản demo (đổi mật khẩu trước khi triển khai):**
- `admin / admin@123` – Quản trị viên (CRUD phác đồ)
- `bs.nguyenvan / bacsi@123` – Bác sĩ Nội Tim mạch
- `bs.tranthi / bacsi@123` – Bác sĩ Nội tiết

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Vite tự proxy `/api/*` → backend ở `localhost:4000`.

### 3. Build production

```bash
cd frontend && npm run build       # → frontend/dist/
# Phục vụ static files qua nginx/Caddy/Apache, point /api → backend:4000
```

---

## Triển khai nội bộ trong bệnh viện

### Khuyến nghị cấu hình
- **Server**: Ubuntu 22.04+, Node.js 20 LTS, 1 vCPU / 1 GB RAM (đủ cho ~50 người dùng đồng thời)
- **Reverse proxy**: nginx hoặc Caddy với TLS (Let's Encrypt nếu có domain nội bộ)
- **Database**: SQLite (đủ dùng), backup định kỳ file `backend/data/medcalc.db`
- **Process manager**: `pm2` hoặc systemd unit cho auto-restart

### Mẫu nginx config
```nginx
server {
    listen 443 ssl;
    server_name medcalc.ttyt-lienchieu.local;

    ssl_certificate     /etc/ssl/medcalc.crt;
    ssl_certificate_key /etc/ssl/medcalc.key;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/medcalc/dist;
        try_files $uri /index.html;
    }
}
```

### Mẫu systemd unit
```ini
[Unit]
Description=MedCalc LLC Backend
After=network.target

[Service]
Type=simple
User=medcalc
WorkingDirectory=/opt/medcalc/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
EnvironmentFile=/opt/medcalc/backend/.env

[Install]
WantedBy=multi-user.target
```

---

## Mở rộng: Thêm bảng kiểm mới

Mỗi calculator là một file JS thuần với schema cố định. Ví dụ thêm Wells Score:

```javascript
// frontend/src/calculators/wells.js
export const wells = {
  id: 'wells-pe',
  name: 'Wells (PE)',
  fullName: 'Thang điểm Wells cho thuyên tắc phổi',
  category: 'cardio',
  categoryLabel: 'Tim mạch',
  shortDescription: 'Đánh giá xác suất lâm sàng thuyên tắc phổi',
  reference: 'Wells PS et al. Thromb Haemost 2000',

  inputs: [
    { id: 'dvt_signs', label: 'Triệu chứng DVT', type: 'binary', points: 3 },
    { id: 'pe_likely', label: 'PE là chẩn đoán khả dĩ nhất', type: 'binary', points: 3 },
    // ...
  ],

  compute(values) {
    let score = 0;
    for (const inp of this.inputs) {
      if (values[inp.id] === 1) score += inp.points;
    }
    return {
      score, unit: 'điểm',
      interpretation: score < 2 ? 'Xác suất thấp' : score < 6 ? 'Trung bình' : 'Cao',
      riskLevel: score < 2 ? 'low' : score < 6 ? 'mod' : 'high'
    };
  }
};
```

Sau đó thêm vào `frontend/src/calculators/index.js`:
```javascript
import { wells } from './wells.js';
export const calculators = [ ..., wells ];
```

UI tự động render — không cần thêm JSX nào.

---

## Bảo mật & tuân thủ

- **JWT** với thời hạn 12 giờ, đổi `JWT_SECRET` trong production
- **Bcrypt** hash mật khẩu (cost = 10)
- **CORS** mặc định mở, nên giới hạn trong production qua nginx
- **Audit trail**: Mọi tính toán được lưu kèm `user_id` và timestamp
- **Khuyến nghị**: Đặt server sau VPN/firewall nội bộ; bật HTTPS; backup DB hàng đêm

> ⚠️ **Tuyên bố pháp lý**: Đây là công cụ hỗ trợ ra quyết định lâm sàng. Quyết định cuối cùng thuộc về bác sĩ điều trị. Hệ thống không thay thế đánh giá lâm sàng toàn diện và phán đoán chuyên môn.

---

## Roadmap đề xuất (giai đoạn 2)

- [ ] 2FA cho tài khoản admin
- [ ] Tích hợp HIS/LIS qua HL7 FHIR
- [ ] Module thống kê: phân bố nguy cơ theo khoa, xu hướng
- [ ] Mobile-responsive cải tiến cho PWA
- [ ] Bộ bảng kiểm mở rộng: qSOFA, GCS, Apgar, Bishop, Padua VTE Risk, ASCVD
- [ ] Export Excel cho báo cáo định kỳ
- [ ] So sánh kết quả qua các lần khám của cùng bệnh nhân

---

## Tài liệu tham khảo của hệ thống

- ESC Guidelines for Atrial Fibrillation 2024
- ESC Guidelines for ACS 2023
- KDIGO Clinical Practice Guideline for CKD 2024
- ADA Standards of Medical Care in Diabetes 2024
- WHO/WPRO Asia-Pacific BMI Classification 2000
- NKF-ASN Task Force on Race-Free eGFR (2021)

---

*Phát triển bởi đội ngũ CNTT – Trung tâm Y tế khu vực Liên Chiểu, 2025.*
