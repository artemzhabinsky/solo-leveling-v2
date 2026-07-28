/**
 * Task Categories & Attribute Mappings (1:1 to Player Attributes)
 */

export const CATEGORIES = [
  { key: 'physical', attr: 'strength', label: '🏋️ Физика (Сила / STR)', color: '#00ff88' },
  { key: 'mental', attr: 'intelligence', label: '💻 Учёба/Работа (Интеллект / INT)', color: '#00f0ff' },
  { key: 'spirit', attr: 'vitality', label: '🏠 Здоровье/Быт (Выносливость / VIT)', color: '#8a2be2' },
  { key: 'finance', attr: 'goldBonus', label: '💰 Финансы (Золото / GOLD)', color: '#ffd700' },
  { key: 'discipline', attr: 'sense', label: '🔥 Привычки/Рутина (Восприятие / SEN)', color: '#ff2a5f' }
];

export function getAttrForCategory(categoryKey) {
  const cat = CATEGORIES.find(c => c.key === categoryKey);
  return cat ? cat.attr : 'intelligence';
}
