/**
 * 7 Goblin Avatar Evolution Stages
 */

export const STAGES = [
  { stage: 1, minLevel: 1, maxLevel: 4, title: 'Пробуждённый Новичок', race: 'Раса: Пробуждённый Искатель E-Ранга' },
  { stage: 2, minLevel: 5, maxLevel: 9, title: 'Хранитель Дисциплины', race: 'Раса: Страж Стриков D-Ранга' },
  { stage: 3, minLevel: 10, maxLevel: 14, title: 'Повелитель Фокуса', race: 'Раса: Авангард C-Ранга' },
  { stage: 4, minLevel: 15, maxLevel: 19, title: 'Стратег Побед', race: 'Раса: Рыцарь B-Ранга' },
  { stage: 5, minLevel: 20, maxLevel: 24, title: 'Мастер Потока', race: 'Раса: Теневой Демон-Командир A-Ранга' },
  { stage: 6, minLevel: 25, maxLevel: 29, title: 'Архитектор Успеха', race: 'Раса: Владыка Подземелий S-Ранга' },
  { stage: 7, minLevel: 30, maxLevel: null, title: 'Абсолютный Монарх Пробуждения', race: 'Раса: Легендарный Гигачад Монарх' }
];

export function getStageForLevel(level) {
  const match = STAGES.find((s) => level >= s.minLevel && (s.maxLevel === null || level <= s.maxLevel));
  return match ? match.stage : STAGES[STAGES.length - 1].stage;
}
