/**
 * TIMI Risk Score for NSTEMI/UA
 * Reference: Antman EM et al. JAMA 2000;284(7):835-42
 */
export const timi = {
  id: 'timi-nstemi',
  name: 'TIMI (NSTEMI/UA)',
  fullName: 'TIMI Risk Score cho NSTEMI/Đau thắt ngực không ổn định',
  category: 'cardio',
  categoryLabel: 'Tim mạch',
  shortDescription: 'Tiên lượng tử vong, NMCT, tái thông cấp cứu trong 14 ngày',
  longDescription:
    'TIMI Risk Score đánh giá nguy cơ tử vong, nhồi máu cơ tim mới hoặc cần tái thông mạch máu cấp cứu trong 14 ngày ở bệnh nhân đau thắt ngực không ổn định/NSTEMI.',
  reference: 'Antman EM et al. JAMA 2000;284(7):835-842',

  inputs: [
    { id: 'age65', label: 'Tuổi ≥ 65', type: 'binary', points: 1 },
    { id: 'cad_risk_factors', label: '≥ 3 yếu tố nguy cơ ĐM vành', hint: 'Gia đình, THA, tăng cholesterol, ĐTĐ, hút thuốc', type: 'binary', points: 1 },
    { id: 'known_cad', label: 'Tiền sử hẹp ĐM vành ≥ 50%', type: 'binary', points: 1 },
    { id: 'asa', label: 'Đã dùng aspirin trong 7 ngày qua', type: 'binary', points: 1 },
    { id: 'angina', label: '≥ 2 cơn đau thắt ngực trong 24 giờ qua', type: 'binary', points: 1 },
    { id: 'st_change', label: 'ST chênh ≥ 0.5mm trên ECG', type: 'binary', points: 1 },
    { id: 'biomarkers', label: 'Tăng men tim (troponin, CK-MB)', type: 'binary', points: 1 }
  ],

  compute(values) {
    let score = 0;
    const breakdown = [];
    for (const input of this.inputs) {
      if (values[input.id] === 1) {
        score += input.points;
        breakdown.push({ label: input.label, points: input.points });
      }
    }

    const riskTable = {
      0: '4.7%', 1: '4.7%', 2: '8.3%', 3: '13.2%', 4: '19.9%', 5: '26.2%', 6: '40.9%', 7: '40.9%'
    };
    const risk = riskTable[score] || '40.9%';

    let interpretation, riskLevel;
    if (score <= 2) { interpretation = 'Nguy cơ THẤP – có thể tiếp cận bảo tồn'; riskLevel = 'low'; }
    else if (score <= 4) { interpretation = 'Nguy cơ TRUNG BÌNH – cân nhắc xâm lấn sớm'; riskLevel = 'mod'; }
    else { interpretation = 'Nguy cơ CAO – chiến lược xâm lấn sớm'; riskLevel = score >= 6 ? 'very-high' : 'high'; }

    return {
      score,
      unit: 'điểm',
      breakdown,
      summary: `Nguy cơ biến cố trong 14 ngày ≈ ${risk}`,
      interpretation,
      riskLevel
    };
  }
};
