/**
 * BMI – Body Mass Index
 * Phân loại theo WHO (toàn cầu) và phân loại châu Á (WPRO/IDI 2000)
 */
export const bmi = {
  id: 'bmi',
  name: 'BMI',
  fullName: 'Chỉ số khối cơ thể – BMI',
  category: 'endo',
  categoryLabel: 'Nội tiết – Chuyển hóa',
  shortDescription: 'Tính BMI và phân loại tình trạng dinh dưỡng',
  longDescription:
    'BMI = cân nặng (kg) / chiều cao (m)². Phân loại sử dụng tiêu chuẩn dành cho người châu Á (WPRO 2000) phù hợp với dân số Việt Nam.',
  reference: 'WHO 2004; WPRO Asia-Pacific Classification 2000',

  inputs: [
    { id: 'weight', label: 'Cân nặng', type: 'number', unit: 'kg', min: 1, max: 300, step: 0.1 },
    { id: 'height', label: 'Chiều cao', type: 'number', unit: 'cm', min: 30, max: 250, step: 0.1 }
  ],

  compute(values) {
    const { weight, height } = values;
    if (!weight || !height) {
      return { score: 0, unit: 'kg/m²', interpretation: 'Vui lòng nhập cân nặng và chiều cao', riskLevel: 'neutral' };
    }
    const h = height / 100;
    const score = Math.round((weight / (h * h)) * 10) / 10;

    let interpretation, riskLevel;
    if (score < 18.5) { interpretation = 'Thiếu cân (Underweight)'; riskLevel = 'mod'; }
    else if (score < 23) { interpretation = 'Bình thường (Normal)'; riskLevel = 'low'; }
    else if (score < 25) { interpretation = 'Tiền béo phì (Overweight – at risk)'; riskLevel = 'mod'; }
    else if (score < 30) { interpretation = 'Béo phì độ I (Obesity I)'; riskLevel = 'high'; }
    else { interpretation = 'Béo phì độ II (Obesity II)'; riskLevel = 'very-high'; }

    return {
      score,
      unit: 'kg/m²',
      summary: 'Phân loại theo tiêu chuẩn Châu Á – WPRO',
      interpretation,
      riskLevel
    };
  }
};
