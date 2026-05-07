/**
 * eGFR theo công thức CKD-EPI 2021 (race-free)
 * Reference: Inker LA et al. NEJM 2021;385:1737-1749
 */
export const egfrCkdEpi = {
  id: 'egfr-ckd-epi',
  name: 'eGFR (CKD-EPI 2021)',
  fullName: 'Ước tính độ lọc cầu thận – CKD-EPI 2021',
  category: 'endo',
  categoryLabel: 'Nội tiết – Chuyển hóa',
  shortDescription: 'Ước tính độ lọc cầu thận theo creatinine huyết thanh',
  longDescription:
    'Công thức CKD-EPI 2021 (không có biến chủng tộc) là chuẩn ước tính eGFR mới được khuyến cáo bởi NKF-ASN Task Force và KDIGO 2024.',
  reference: 'Inker LA et al. NEJM 2021;385:1737-1749; KDIGO 2024',

  inputs: [
    { id: 'creatinine', label: 'Creatinine huyết thanh', type: 'number', unit: 'mg/dL', min: 0.1, max: 15, step: 0.01 },
    { id: 'age', label: 'Tuổi', type: 'number', unit: 'năm', min: 18, max: 120 },
    { id: 'sex', label: 'Giới tính', type: 'choice', options: [
      { label: 'Nam', value: 'M', points: 0 },
      { label: 'Nữ', value: 'F', points: 0 }
    ]}
  ],

  compute(values) {
    const { creatinine, age, sex } = values;
    if (!creatinine || !age || !sex) {
      return { score: 0, unit: '', interpretation: 'Vui lòng nhập đầy đủ thông tin', riskLevel: 'neutral' };
    }

    // CKD-EPI 2021 (race-free)
    const isFemale = sex === 'F';
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const sexFactor = isFemale ? 1.012 : 1.0;

    const scrK = creatinine / kappa;
    const minTerm = Math.pow(Math.min(scrK, 1), alpha);
    const maxTerm = Math.pow(Math.max(scrK, 1), -1.200);
    const ageFactor = Math.pow(0.9938, age);

    const egfr = 142 * minTerm * maxTerm * ageFactor * sexFactor;
    const egfrRounded = Math.round(egfr * 10) / 10;

    let stage, interpretation, riskLevel;
    if (egfr >= 90) {
      stage = 'G1'; riskLevel = 'low';
      interpretation = 'Chức năng thận bình thường (G1). Có CKD nếu kèm tổn thương thận khác (albumin niệu, hình ảnh).';
    } else if (egfr >= 60) {
      stage = 'G2'; riskLevel = 'low';
      interpretation = 'Giảm nhẹ (G2). Có CKD nếu kèm tổn thương thận khác.';
    } else if (egfr >= 45) {
      stage = 'G3a'; riskLevel = 'mod';
      interpretation = 'Bệnh thận mạn G3a – Giảm nhẹ đến trung bình. Đánh giá nguyên nhân, kiểm soát YTNC.';
    } else if (egfr >= 30) {
      stage = 'G3b'; riskLevel = 'mod';
      interpretation = 'Bệnh thận mạn G3b – Giảm trung bình đến nặng. Hội chẩn nội thận, hiệu chỉnh liều thuốc.';
    } else if (egfr >= 15) {
      stage = 'G4'; riskLevel = 'high';
      interpretation = 'Bệnh thận mạn G4 – Giảm nặng. Chuyển nội thận, chuẩn bị thay thế thận.';
    } else {
      stage = 'G5'; riskLevel = 'very-high';
      interpretation = 'Bệnh thận mạn G5 – Suy thận. Cần lọc máu hoặc ghép thận.';
    }

    return {
      score: egfrRounded,
      unit: 'mL/phút/1.73m²',
      summary: `Giai đoạn ${stage} (KDIGO 2024)`,
      interpretation,
      riskLevel
    };
  }
};
