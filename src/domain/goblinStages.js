/**
 * 7 Goblin Avatar Evolution Stages
 */

export const STAGES = [
  { stage: 1, minLevel: 1, maxLevel: 4, title: 'Нищий Гоблин-Оборванец', race: 'Раса: Лесной Слакер E-Ранга' },
  { stage: 2, minLevel: 5, maxLevel: 9, title: 'Гоблин-Мусорщик / Картонный Рыцарь', race: 'Раса: Начинающий Качатель Правых Рук' },
  { stage: 3, minLevel: 10, maxLevel: 14, title: 'Охотник E-Ранга / Гоблин-Боец', race: 'Раса: Воин Дневного Стрика' },
  { stage: 4, minLevel: 15, maxLevel: 19, title: 'Охотник D-Ранга / Гоблин-Воин', race: 'Раса: Теневой Кадет' },
  { stage: 5, minLevel: 20, maxLevel: 24, title: 'Охотник C-Ранга / Теневой Рыцарь', race: 'Раса: Теневой Демон' },
  { stage: 6, minLevel: 25, maxLevel: 29, title: 'Охотник A-Ранга / Теневой Лорд', race: 'Раса: Владыка Подземелий' },
  { stage: 7, minLevel: 30, maxLevel: null, title: 'Гигачат Гоблин-Трахатель 30-го Уровня', race: 'Раса: Абсолютный Гигачад Монарх' },
];

export function getStageForLevel(level) {
  const match = STAGES.find((s) => level >= s.minLevel && (s.maxLevel === null || level <= s.maxLevel));
  return match ? match.stage : STAGES[STAGES.length - 1].stage;
}
