/**
 * HbA1c → Estimated Average Glucose
 * Reference: Nathan DM et al. Diabetes Care 2008 (ADAG study)
 */
export const hba1c = {
  id: 'hba1c-eag',
  name: 'HbA1c → eAG',
  fullName: 'HbA1c & Đường huyết trung bình ước tính',
  category: 'endo',
  categoryLabel: 'Nội tiết – Chuyển hóa',
  shortDescription: 'Quy đổi HbA1c sang đường huyết trung bình ước tính (eAG)',
  longDescription:
    'Công thức ADAG: eAG (mg/dL) = 28.7 × HbA1c – 46.7. Hỗ trợ tư vấn cho bệnh nhân đái tháo đường về mục tiêu kiểm soát.',
  reference: 'Nathan DM et al. Diabetes Care 2008;31(8):1473-8',

  inputs: [
    { id: 'hba1c', label: 'HbA1c', type: 'number', unit: '%', min: 3, max: 20, step: 0.1 }
  ],

  compute(values) {
    const { hba1c } = values;
    if (!hba1c) {
      return { score: 0, unit: 'mg/dL', interpretation: 'Vui lòng nhập HbA1c', riskLevel: 'neutral' };
    }
    const eAG = Math.round((28.7 * hba1c - 46.7) * 10) / 10;
    const eAG_mmol = Math.round((eAG / 18.0182) * 10) / 10;

    let interpretation, riskLevel;
    if (hba1c < 5.7) {
      interpretation = 'Bình thường (không ĐTĐ)'; riskLevel = 'low';
    } else if (hba1c < 6.5) {
      interpretation = 'Tiền đái tháo đường (5.7–6.4%) – cần thay đổi lối sống, tầm soát định kỳ.'; riskLevel = 'mod';
    } else if (hba1c < 7) {
      interpretation = 'Đái tháo đường – Kiểm soát tốt (mục tiêu chung ADA 2024: < 7%)'; riskLevel = 'low';
    } else if (hba1c < 8) {
      interpretation = 'Đái tháo đường – Kiểm soát chưa đạt. Tăng cường điều trị.'; riskLevel = 'mod';
    } else if (hba1c < 9) {
      interpretation = 'Đái tháo đường – Kiểm soát kém. Xem xét lại phác đồ.'; riskLevel = 'high';
    } else {
      interpretation = 'Đái tháo đường – Kiểm soát rất kém. Cần can thiệp tích cực.'; riskLevel = 'very-high';
    }

    return {
      score: eAG,
      unit: 'mg/dL',
      summary: `≈ ${eAG_mmol} mmol/L (đường huyết TB ước tính)`,
      interpretation,
      riskLevel
    };
  }
};
