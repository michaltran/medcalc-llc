/**
 * CHA₂DS₂-VASc Score
 * Phân tầng nguy cơ đột quỵ ở bệnh nhân rung nhĩ không do van tim
 * Reference: Lip GY et al. Chest 2010; ESC Guidelines 2024
 */
export const cha2ds2vasc = {
  id: 'cha2ds2-vasc',
  name: 'CHA₂DS₂-VASc',
  fullName: 'Thang điểm CHA₂DS₂-VASc',
  category: 'cardio',
  categoryLabel: 'Tim mạch',
  shortDescription: 'Phân tầng nguy cơ đột quỵ ở bệnh nhân rung nhĩ không do van tim',
  longDescription:
    'Thang điểm CHA₂DS₂-VASc dự đoán nguy cơ đột quỵ và thuyên tắc hệ thống ở bệnh nhân rung nhĩ không do van tim, hỗ trợ quyết định khởi trị thuốc chống đông.',
  reference: 'Lip GY et al. Chest 2010; ESC Atrial Fibrillation Guidelines 2024',

  inputs: [
    {
      id: 'chf',
      label: 'Suy tim sung huyết / Rối loạn chức năng thất trái',
      hint: 'Tiền sử suy tim hoặc EF ≤ 40%',
      type: 'binary',
      points: 1
    },
    {
      id: 'htn',
      label: 'Tăng huyết áp',
      hint: 'HA tâm thu > 140 mmHg hoặc đang điều trị THA',
      type: 'binary',
      points: 1
    },
    {
      id: 'age',
      label: 'Tuổi',
      type: 'choice',
      options: [
        { label: '< 65', value: 0, points: 0 },
        { label: '65 – 74', value: 1, points: 1 },
        { label: '≥ 75', value: 2, points: 2 }
      ]
    },
    {
      id: 'dm',
      label: 'Đái tháo đường',
      hint: 'Đường huyết đói > 125 mg/dL hoặc đang điều trị ĐTĐ',
      type: 'binary',
      points: 1
    },
    {
      id: 'stroke',
      label: 'Tiền sử đột quỵ / TIA / thuyên tắc',
      type: 'binary',
      points: 2
    },
    {
      id: 'vascular',
      label: 'Bệnh mạch máu',
      hint: 'NMCT cũ, bệnh động mạch ngoại biên, mảng xơ vữa ĐMC',
      type: 'binary',
      points: 1
    },
    {
      id: 'female',
      label: 'Giới tính nữ',
      type: 'binary',
      points: 1
    }
  ],

  compute(values) {
    let score = 0;
    let breakdown = [];

    for (const input of this.inputs) {
      const v = values[input.id];
      let pts = 0;
      if (input.type === 'binary' && v === 1) pts = input.points;
      if (input.type === 'choice') {
        const opt = input.options.find(o => o.value === v);
        pts = opt ? opt.points : 0;
      }
      if (pts > 0) breakdown.push({ label: input.label, points: pts });
      score += pts;
    }

    // Risk stratification per ESC 2024
    const isFemale = values.female === 1;
    const effectiveScore = score; // Female sex modifier already in score

    let strokeRisk, recommendation, riskLevel;
    // Annual stroke risk per Lip et al
    const annualRiskTable = {
      0: '0.2%', 1: '0.6%', 2: '2.2%', 3: '3.2%', 4: '4.8%',
      5: '7.2%', 6: '9.7%', 7: '11.2%', 8: '10.8%', 9: '12.2%'
    };
    strokeRisk = annualRiskTable[Math.min(score, 9)] + '/năm';

    if ((!isFemale && score === 0) || (isFemale && score === 1)) {
      recommendation = 'Không cần chống đông';
      riskLevel = 'low';
    } else if ((!isFemale && score === 1) || (isFemale && score === 2)) {
      recommendation = 'Cân nhắc chống đông (DOAC ưu tiên)';
      riskLevel = 'mod';
    } else {
      recommendation = 'Khuyến cáo chống đông (DOAC ưu tiên hơn warfarin)';
      riskLevel = score >= 4 ? 'very-high' : 'high';
    }

    return {
      score,
      unit: 'điểm',
      breakdown,
      summary: `Nguy cơ đột quỵ hằng năm ≈ ${strokeRisk}`,
      interpretation: recommendation,
      riskLevel
    };
  }
};
