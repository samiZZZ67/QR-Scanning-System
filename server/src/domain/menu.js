export const ICON_OPTIONS = [
  'Utensils', 'Flame', 'Pizza', 'CakeSlice',
  'Coffee', 'CupSoda', 'GlassWater', 'Leaf'
];

export function validIcon(icon) {
  return ICON_OPTIONS.includes(icon) ? icon : 'Utensils';
}

export function sanitizePrice(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}
