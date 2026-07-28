/**
 * 30 Named Ranks & Titles Table (Levels 1 to 30+)
 */

export const RANKS = [
  { level: 1, title: 'Нищий Гоблин-Оборванец', rankCode: 'E', description: 'Грезит о великих делах в рваных трусах с деревянной ложкой.' },
  { level: 2, title: 'Гоблин с Картонным Щитом', rankCode: 'E', description: 'Нашел коробку от микроволновки. Считает себя рыцарем.' },
  { level: 3, title: 'Диванный Воин Подъезда', rankCode: 'E', description: 'Раздаёт советы в интернете, не вставая с дивана.' },
  { level: 4, title: 'Новичок Прокрастинации', rankCode: 'E', description: 'Переносит задачи «на завтра» быстрее скорости света.' },
  { level: 5, title: 'Собиратель Мелких Скидок', rankCode: 'E', description: 'Знает где взять просроченный сырок и выпросить балл.' },
  { level: 6, title: 'Охотник за Бесплатным Wi-Fi', rankCode: 'D', description: 'Готов пройти 5 км ради одной полоски интернета.' },
  { level: 7, title: 'Мастер Доширачных Искусств', rankCode: 'D', description: 'Заваривает лапшу за 2 минуты 59 секунд.' },
  { level: 8, title: 'Воин Кофейного Передоза', rankCode: 'D', description: '5-я чашка растворимого кофе. Глаз дёргается, но работает.' },
  { level: 9, title: 'Собиратель Просроченных Дедлайнов', rankCode: 'D', description: 'Жонглирует горящими дедлайнами без страха.' },
  { level: 10, title: 'Охотник E-Ранга (Выживший)', rankCode: 'D', description: 'Появился тёмный плащ и неоновый блеск в глазах.' },
  { level: 11, title: 'Гроза Домашних Тараканов', rankCode: 'C', description: 'Тапочек в его руке — артефакт S-ранга.' },
  { level: 12, title: 'Пожиратель Ночных Снеков', rankCode: 'C', description: 'Вылазки к холодильнику проходят бесшумно.' },
  { level: 13, title: 'Властелин Будильников', rankCode: 'C', description: '15 будильников с интервалом 5 минут. Почти проснулся.' },
  { level: 14, title: 'Повелитель Перерывов на Чай', rankCode: 'C', description: '10 минут работы, 45 минут выбора чая.' },
  { level: 15, title: 'Теневой Уборщик Комнаты', rankCode: 'C', description: 'Раз в месяц сгребает все вещи под кровать.' },
  { level: 16, title: 'Воин Отложенных Сообщений', rankCode: 'B', description: 'Отвечает «Сейчас посмотрю» спустя 4 дня.' },
  { level: 17, title: 'Гладиатор Экспресс-Учёбы', rankCode: 'B', description: 'Выучил семестр за 3 часа до экзамена.' },
  { level: 18, title: 'Охотник D-Ранга (Уверенный)', rankCode: 'B', description: 'В глазах блеск Системы, появилась аура.' },
  { level: 19, title: 'Властелин Гаджетов на Зарядке', rankCode: 'B', description: 'Одновременно заряжает все гаджеты в доме.' },
  { level: 20, title: 'Рыцарь Тёмного Энергетика', rankCode: 'B', description: 'Кровь состоит на 40% из таурина. Не спит, а перезагружается.' },
  { level: 21, title: 'Охотник C-Ранга (Теневой Кадет)', rankCode: 'A', description: 'Тень начинает слушать команды. Осанка идеальна.' },
  { level: 22, title: 'Укротитель Бытовых Монстров', rankCode: 'A', description: 'Гора посуды в раковине больше не пугает.' },
  { level: 23, title: 'Бегущий по Дедлайнам', rankCode: 'A', description: 'Режим гиперскорости за 10 минут до созвона.' },
  { level: 24, title: 'Магистр Таблиц Excel', rankCode: 'A', description: 'Управляет жизнью через формулы и ячейки.' },
  { level: 25, title: 'Охотник B-Ранга (Теневой Рыцарь)', rankCode: 'A', description: 'Фиолетовая аура, стальной клинок, дисциплина.' },
  { level: 26, title: 'Архитектор Продуктивности', rankCode: 'S', description: 'Строит империю из выполненных задач.' },
  { level: 27, title: 'Гигачад Утренней Зарядки', rankCode: 'S', description: 'Делает отжимания до открытия глаз.' },
  { level: 28, title: 'Охотник A-Ранга (Теневой Лорд)', rankCode: 'S', description: 'Задачи выполняются от одного его взгляда.' },
  { level: 29, title: 'Разрушитель Лени S-Ранга', rankCode: 'S', description: 'Лень при виде него уходит в депрессию.' },
  { level: 30, title: 'Гигачат Гоблин-Трахатель 30-го Уровня', rankCode: 'MONARCH', description: 'Пик эволюции. Занимает весь экран прессом и величием.' },
];

export function getRankTitle(level) {
  const clamped = Math.min(Math.max(level, 1), 30);
  return RANKS[clamped - 1];
}
