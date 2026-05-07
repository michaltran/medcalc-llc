/**
 * GRACE Score 2.0
 * Tiên lượng tử vong nội viện và 6 tháng ở bệnh nhân HCMVC
 * Reference: Granger CB et al. Arch Intern Med 2003; Fox KAA et al. BMJ 2006
 */
export const grace = {
  id: 'grace',
  name: 'GRACE 2.0',
  fullName: 'Thang điểm GRACE',
  category: 'cardio',
  categoryLabel: 'Tim mạch',
  shortDescription: 'Tiên lượng tử vong ở bệnh nhân hội chứng mạch vành cấp',
  longDescription:
    'GRACE Score giúp tiên lượng tử vong nội viện và trong 6 tháng ở bệnh nhân hội chứng mạch vành cấp (NSTEMI/UA và STEMI), hỗ trợ quyết định chiến lược can thiệp.',
  reference: 'Granger CB et al. Arch Intern Med 2003; ESC NSTE-ACS Guidelines 2023',

  inputs: [
    { id: 'age', label: 'Tuổi', type: 'number', unit: 'năm', min: 18, max: 120 },
    { id: 'hr', label: 'Tần số tim', type: 'number', unit: 'lần/phút', min: 30, max: 250 },
    { id: 'sbp', label: 'Huyết áp tâm thu', type: 'number', unit: 'mmHg', min: 50, max: 250 },
    { id: 'creatinine', label: 'Creatinine huyết thanh', type: 'number', unit: 'mg/dL', min: 0.1, max: 15, step: 0.1 },
    {
      id: 'killip',
      label: 'Phân độ Killip',
      type: 'select',
      options: [
        { label: 'I – Không có dấu hiệu suy tim', value: 1 },
        { label: 'II – Ran ẩm < 1/2 phổi, T3', value: 2 },
        { label: 'III – Phù phổi', value: 3 },
        { label: 'IV – Sốc tim', value: 4 }
      ]
    },
    { id: 'cardiac_arrest', label: 'Ngưng tim lúc nhập viện', type: 'binary', points: 0 },
    { id: 'st_deviation', label: 'ST chênh trên ECG', type: 'binary', points: 0 },
    { id: 'elevated_enzymes', label: 'Tăng men tim', type: 'binary', points: 0 }
  ],

  compute(values) {
    const { age, hr, sbp, creatinine, killip, cardiac_arrest, st_deviation, elevated_enzymes } = values;

    // GRACE 2.0 simplified scoring (clinically validated approximation)
    let score = 0;

    // Age points
    if (age < 30) score += 0;
    else if (age < 40) score += 8;
    else if (age < 50) score += 25;
    else if (age < 60) score += 41;
    else if (age < 70) score += 58;
    else if (age < 80) score += 75;
    else if (age < 90) score += 91;
    else score += 100;

    // Heart rate
    if (hr < 50) score += 0;
    else if (hr < 70) score += 3;
    else if (hr < 90) score += 9;
    else if (hr < 110) score += 15;
    else if (hr < 150) score += 24;
    else if (hr < 200) score += 38;
    else score += 46;

    // SBP
    if (sbp < 80) score += 58;
    else if (sbp < 100) score += 53;
    else if (sbp < 120) score += 43;
    else if (sbp < 140) score += 34;
    else if (sbp < 160) score += 24;
    else if (sbp < 200) score += 10;
    else score += 0;

    // Creatinine (mg/dL)
    if (creatinine < 0.4) score += 1;
    else if (creatinine < 0.8) score += 4;
    else if (creatinine < 1.2) score += 7;
    else if (creatinine < 1.6) score += 10;
    else if (creatinine < 2.0) score += 13;
    else if (creatinine < 4.0) score += 21;
    else score += 28;

    // Killip class
    const killipPoints = { 1: 0, 2: 20, 3: 39, 4: 59 };
    score += killipPoints[killip] || 0;

    if (cardiac_arrest === 1) score += 39;
    if (st_deviation === 1) score += 28;
    if (elevated_enzymes === 1) score += 14;

    // In-hospital mortality risk
    let inHospital, sixMonth, riskLevel, interpretation;
    if (score <= 108) {
      inHospital = '< 1%'; sixMonth = '< 3%';
      riskLevel = 'low';
      interpretation = 'Nguy cơ THẤP. Có thể điều trị bảo tồn ban đầu, đánh giá lại nếu có dấu hiệu nguy cơ.';
    } else if (score <= 140) {
      inHospital = '1 – 3%'; sixMonth = '3 – 8%';
      riskLevel = 'mod';
      interpretation = 'Nguy cơ TRUNG BÌNH. Cân nhắc chiến lược xâm lấn sớm trong vòng 24-72 giờ.';
    } else {
      inHospital = '> 3%'; sixMonth = '> 8%';
      riskLevel = score > 170 ? 'very-high' : 'high';
      interpretation = 'Nguy cơ CAO. Khuyến cáo chiến lược xâm lấn sớm trong vòng 24 giờ (ESC 2023).';
    }

    return {
      score,
      unit: 'điểm',
      summary: `Tử vong nội viện ≈ ${inHospital}, tử vong 6 tháng ≈ ${sixMonth}`,
      interpretation,
      riskLevel
    };
  }
};
