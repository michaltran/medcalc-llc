/**
 * Khởi tạo database SQLite cho hệ thống MedCalc LLC
 * Trung tâm Y tế khu vực Liên Chiểu
 */
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'medcalc.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Use shared db module which auto-falls-back if better-sqlite3 isn't available
process.env.DB_PATH = DB_PATH;
const db = require('./db');

// ============ SCHEMA ============
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'doctor', -- admin | doctor | nurse
    department TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    medical_record_number TEXT UNIQUE NOT NULL, -- Mã bệnh án
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT, -- M | F | O
    phone TEXT,
    address TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS calculation_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    patient_id INTEGER,
    calculator_id TEXT NOT NULL, -- e.g. 'cha2ds2-vasc'
    calculator_name TEXT NOT NULL,
    inputs_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    interpretation TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  );

  CREATE TABLE IF NOT EXISTS protocols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calculator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL, -- Markdown content
    department TEXT,
    version TEXT DEFAULT '1.0',
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (updated_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_history_patient ON calculation_history(patient_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON calculation_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_calc ON calculation_history(calculator_id);
  CREATE INDEX IF NOT EXISTS idx_protocols_calc ON protocols(calculator_id);
`);

// ============ SEED DATA ============
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;

if (userCount === 0) {
  console.log('🌱 Seeding initial users...');

  const adminHash = bcrypt.hashSync('admin@123', 10);
  const doctorHash = bcrypt.hashSync('bacsi@123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, department)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', adminHash, 'Quản trị hệ thống', 'admin', 'CNTT');
  insertUser.run('bs.nguyenvan', doctorHash, 'BS. Nguyễn Văn A', 'doctor', 'Khoa Nội Tim mạch');
  insertUser.run('bs.tranthi', doctorHash, 'BS. Trần Thị B', 'doctor', 'Khoa Nội tiết');

  console.log('✅ Created admin / admin@123');
  console.log('✅ Created bs.nguyenvan / bacsi@123');
  console.log('✅ Created bs.tranthi / bacsi@123');
}

const protocolCount = db.prepare('SELECT COUNT(*) as c FROM protocols').get().c;

if (protocolCount === 0) {
  console.log('🌱 Seeding clinical protocols...');

  const insertProtocol = db.prepare(`
    INSERT INTO protocols (calculator_id, title, content_md, department, version)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertProtocol.run(
    'cha2ds2-vasc',
    'Phác đồ chống đông trong rung nhĩ không do van tim - TTYT Liên Chiểu',
    `# Phác đồ chống đông cho bệnh nhân rung nhĩ không do van tim

## Áp dụng tại Trung tâm Y tế khu vực Liên Chiểu
*Ban hành theo Quyết định số XX/QĐ-TTYT, cập nhật theo Hướng dẫn ESC 2024*

## 1. Phân tầng nguy cơ theo CHA₂DS₂-VASc

| Điểm | Khuyến cáo điều trị |
|------|---------------------|
| **Nam = 0 / Nữ = 1** | Không cần chống đông |
| **Nam = 1 / Nữ = 2** | Cân nhắc chống đông (thảo luận với BN) |
| **Nam ≥ 2 / Nữ ≥ 3** | **Chỉ định chống đông** |

## 2. Lựa chọn thuốc chống đông

### Ưu tiên DOAC (Direct Oral Anticoagulants):
- **Apixaban** 5mg × 2 lần/ngày (giảm liều 2.5mg × 2 nếu có ≥2/3 tiêu chí: ≥80 tuổi, ≤60kg, Cr ≥1.5 mg/dL)
- **Rivaroxaban** 20mg/ngày (15mg nếu CrCl 15-49 mL/phút)
- **Dabigatran** 150mg × 2 lần/ngày (110mg × 2 nếu ≥80 tuổi)

### Warfarin (khi không thể dùng DOAC):
- Mục tiêu INR 2.0–3.0
- Theo dõi INR mỗi 4 tuần khi ổn định

## 3. Đánh giá nguy cơ chảy máu (HAS-BLED)
Trước khi khởi trị, đánh giá HAS-BLED. Điểm ≥3 cần theo dõi sát nhưng **không phải chống chỉ định** chống đông.

## 4. Liên hệ tư vấn
- Khoa Nội Tim mạch: máy lẻ 201
- Trực cấp cứu: 24/7

> ⚠️ Phác đồ này mang tính tham khảo. Quyết định lâm sàng cuối cùng thuộc về bác sĩ điều trị, dựa trên đánh giá toàn diện.`,
    'Khoa Nội Tim mạch',
    '2024.1'
  );

  insertProtocol.run(
    'egfr-ckd-epi',
    'Phác đồ xử trí khi phát hiện giảm chức năng thận',
    `# Phác đồ xử trí khi phát hiện giảm eGFR

## Áp dụng tại Trung tâm Y tế khu vực Liên Chiểu

## 1. Phân giai đoạn bệnh thận mạn (KDIGO 2024)

| Giai đoạn | eGFR (mL/phút/1.73m²) | Xử trí |
|-----------|----------------------|--------|
| G1 | ≥90 | Theo dõi nếu có albumin niệu |
| G2 | 60–89 | Theo dõi nếu có albumin niệu |
| G3a | 45–59 | Đánh giá nguyên nhân, kiểm soát YTNC |
| G3b | 30–44 | Hội chẩn nội thận |
| G4 | 15–29 | **Chuyển nội thận, chuẩn bị thay thế thận** |
| G5 | <15 | **Lọc máu / ghép thận** |

## 2. Hiệu chỉnh liều thuốc khi suy thận
- Tham khảo bảng hiệu chỉnh liều của Khoa Dược
- Tránh: NSAIDs, aminoglycoside, thuốc cản quang khi không cần thiết
- Metformin: ngưng khi eGFR <30

## 3. Theo dõi và hội chẩn
- eGFR <60 kéo dài >3 tháng = Bệnh thận mạn
- Hội chẩn Khoa Nội thận khi eGFR <45 hoặc giảm nhanh >5 mL/phút/năm`,
    'Khoa Nội tiết',
    '2024.1'
  );

  console.log('✅ Seeded 2 clinical protocols');
}

console.log('\n✨ Database initialized at:', DB_PATH);
db.close();
