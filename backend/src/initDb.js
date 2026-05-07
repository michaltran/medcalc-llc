/**
 * Khởi tạo PostgreSQL schema và seed data
 * Chạy: node src/initDb.js
 */
const bcrypt = require('bcryptjs');
const { pool, query, one } = require('./db');

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'doctor',
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    medical_record_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    phone TEXT,
    address TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS calculation_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    patient_id INTEGER REFERENCES patients(id),
    calculator_id TEXT NOT NULL,
    calculator_name TEXT NOT NULL,
    inputs_json JSONB NOT NULL,
    result_json JSONB NOT NULL,
    interpretation TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS protocols (
    id SERIAL PRIMARY KEY,
    calculator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content_md TEXT NOT NULL,
    department TEXT,
    version TEXT DEFAULT '1.0',
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
  );

  CREATE INDEX IF NOT EXISTS idx_history_patient ON calculation_history(patient_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON calculation_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_calc ON calculation_history(calculator_id);
  CREATE INDEX IF NOT EXISTS idx_protocols_calc ON protocols(calculator_id);
  CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(medical_record_number);
`;

async function init() {
  console.log('🔧 Connecting to PostgreSQL...');
  console.log('   Host:', process.env.PGHOST || (process.env.DATABASE_URL ? '(via DATABASE_URL)' : 'localhost'));

  try {
    await query('SELECT 1');
    console.log('✅ Connected to PostgreSQL\n');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('\nKiểm tra:');
    console.error('  1. PostgreSQL có đang chạy không?');
    console.error('  2. Thông tin trong .env có đúng không?');
    console.error('  3. Database "medcalc_db" đã được tạo chưa?');
    console.error('     Tạo bằng: createdb medcalc_db   (hoặc dùng pgAdmin)');
    process.exit(1);
  }

  console.log('🔧 Creating schema...');
  await query(SCHEMA_SQL);
  console.log('✅ Schema ready\n');

  // Seed users
  const userCount = (await one('SELECT COUNT(*)::int AS c FROM users')).c;
  if (userCount === 0) {
    console.log('🌱 Seeding initial users...');
    const adminHash = await bcrypt.hash('admin@123', 10);
    const doctorHash = await bcrypt.hash('bacsi@123', 10);

    await query(
      `INSERT INTO users (username, password_hash, full_name, role, department) VALUES
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10),
       ($11, $12, $13, $14, $15)`,
      [
        'admin', adminHash, 'Quản trị hệ thống', 'admin', 'CNTT',
        'bs.nguyenvan', doctorHash, 'BS. Nguyễn Văn A', 'doctor', 'Khoa Nội Tim mạch',
        'bs.tranthi', doctorHash, 'BS. Trần Thị B', 'doctor', 'Khoa Nội tiết'
      ]
    );
    console.log('✅ Created admin / admin@123');
    console.log('✅ Created bs.nguyenvan / bacsi@123');
    console.log('✅ Created bs.tranthi / bacsi@123\n');
  } else {
    console.log(`ℹ️  Users đã tồn tại (${userCount}), skip seed users\n`);
  }

  // Seed protocols
  const protocolCount = (await one('SELECT COUNT(*)::int AS c FROM protocols')).c;
  if (protocolCount === 0) {
    console.log('🌱 Seeding clinical protocols...');

    await query(
      `INSERT INTO protocols (calculator_id, title, content_md, department, version) VALUES ($1, $2, $3, $4, $5)`,
      [
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

### Ưu tiên DOAC:
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
      ]
    );

    await query(
      `INSERT INTO protocols (calculator_id, title, content_md, department, version) VALUES ($1, $2, $3, $4, $5)`,
      [
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
      ]
    );

    console.log('✅ Seeded 2 clinical protocols\n');
  } else {
    console.log(`ℹ️  Protocols đã tồn tại (${protocolCount}), skip seed protocols\n`);
  }

  console.log('✨ Database initialized successfully');
  await pool.end();
}

init().catch(err => {
  console.error('Init failed:', err);
  process.exit(1);
});
