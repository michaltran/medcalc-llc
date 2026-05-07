/**
 * HAS-BLED Score
 * Đánh giá nguy cơ chảy máu lớn khi điều trị chống đông
 * Reference: Pisters R et al. Chest 2010
 */
export const hasbled = {
  id: 'has-bled',
  name: 'HAS-BLED',
  fullName: 'Thang điểm HAS-BLED',
  category: 'cardio',
  categoryLabel: 'Tim mạch',
  shortDescription: 'Đánh giá nguy cơ chảy máu lớn ở bệnh nhân dùng thuốc chống đông',
  longDescription:
    'HAS-BLED giúp ước lượng nguy cơ chảy máu lớn (đặc biệt nội sọ) trong vòng 1 năm ở bệnh nhân rung nhĩ điều trị chống đông. Điểm cao không phải chống chỉ định mà chỉ định kiểm soát các yếu tố nguy cơ có thể điều chỉnh.',
  reference: 'Pisters R et al. Chest 2010; 138(5):1093-1100',

  inputs: [
    { id: 'htn', label: 'Tăng huyết áp không kiểm soát (HATT > 160 mmHg)', type: 'binary', points: 1 },
    { id: 'renal', label: 'Suy thận (lọc thận / ghép / Cr ≥ 200 µmol/L)', type: 'binary', points: 1 },
    { id: 'liver', label: 'Suy gan (xơ gan / Bilirubin > 2× / AST,ALT,ALP > 3×)', type: 'binary', points: 1 },
    { id: 'stroke', label: 'Tiền sử đột quỵ', type: 'binary', points: 1 },
    { id: 'bleeding', label: 'Tiền sử chảy máu hoặc cơ địa dễ chảy máu', type: 'binary', points: 1 },
    { id: 'inr', label: 'INR không ổn định (TTR < 60% nếu dùng warfarin)', type: 'binary', points: 1 },
    { id: 'elderly', label: 'Tuổi > 65', type: 'binary', points: 1 },
    { id: 'drugs', label: 'Dùng thuốc dễ gây chảy máu (NSAIDs, kháng kết tập tiểu cầu)', type: 'binary', points: 1 },
    { id: 'alcohol', label: 'Lạm dụng rượu (≥ 8 đơn vị/tuần)', type: 'binary', points: 1 }
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

    let interpretation, riskLevel;
    if (score <= 1) {
      interpretation = 'Nguy cơ chảy máu THẤP. Không phải chống chỉ định chống đông.';
      riskLevel = 'low';
    } else if (score === 2) {
      interpretation = 'Nguy cơ chảy máu TRUNG BÌNH. Theo dõi sát, kiểm soát YTNC điều chỉnh được.';
      riskLevel = 'mod';
    } else {
      interpretation = `Nguy cơ chảy máu CAO (≥ ${score} điểm). Cần đánh giá lợi ích/nguy cơ kỹ, kiểm soát các yếu tố điều chỉnh được (THA, INR, thuốc, rượu).`;
      riskLevel = 'high';
    }

    return {
      score,
      unit: 'điểm',
      breakdown,
      summary: `Nguy cơ chảy máu lớn 1 năm ≈ ${{0:'1.13%',1:'1.02%',2:'1.88%',3:'3.74%',4:'8.70%',5:'12.50%'}[Math.min(score,5)]}`,
      interpretation,
      riskLevel
    };
  }
};
