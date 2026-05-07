import { cha2ds2vasc } from './cha2ds2vasc.js';
import { hasbled } from './hasbled.js';
import { grace } from './grace.js';
import { timi } from './timi.js';
import { egfrCkdEpi } from './egfr.js';
import { bmi } from './bmi.js';
import { hba1c } from './hba1c.js';

export const calculators = [
  cha2ds2vasc,
  hasbled,
  grace,
  timi,
  egfrCkdEpi,
  bmi,
  hba1c
];

export const categories = [
  { id: 'cardio', label: 'Tim mạch', icon: '🫀' },
  { id: 'endo', label: 'Nội tiết – Chuyển hóa', icon: '🧬' }
];

export function findCalculator(id) {
  return calculators.find(c => c.id === id);
}

export function getCalculatorsByCategory(categoryId) {
  return calculators.filter(c => c.category === categoryId);
}
