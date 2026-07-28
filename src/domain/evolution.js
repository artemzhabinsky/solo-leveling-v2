/**
 * Character Evolution Tiers & Race Descriptions Domain Logic
 */

export class SystemState {
  static getAvatarEvolution(level) {
    const tiers = [
      {
        tier: 1,
        minLevel: 1,
        maxLevel: 5,
        name: 'Нищий Гоблин-Оборванец',
        race: 'Раса: Лесной Слакер E-Ранга',
        icon: '🧟',
        description: 'Самое слабое существо в подземелье. Ходит в рванье с палкой и боится каждого шороха. Выполняйте задачи, чтобы перестать быть оборванцем!',
        nextUnlock: 6
      },
      {
        tier: 2,
        minLevel: 6,
        maxLevel: 15,
        name: 'D-Ранг Новичок в Броне',
        race: 'Раса: Начинающий Качатель Правых Рук',
        icon: '🛡️',
        description: 'Уже не гоблин, но меч всё ещё затуплен. Первые успехи в дисциплине дают о себе знать! Пора переходить к серьезным нагрузкам.',
        nextUnlock: 16
      },
      {
        tier: 3,
        minLevel: 16,
        maxLevel: 35,
        name: 'C-Ранг Адепт Качалки',
        race: 'Раса: Воин Дневного Стрика',
        icon: '⚔️',
        description: 'Прокачанные мускулы, двойные кинжалы и стальной пресс. Прокрастинаторы бегут в страхе, когда ты берешься за список дел!',
        nextUnlock: 36
      },
      {
        tier: 4,
        minLevel: 36,
        maxLevel: 65,
        name: 'B-Ранг Тёмный Рыцарь Тей',
        race: 'Раса: Командир Теневого Подразделения',
        icon: '🌌',
        description: 'Тёмный рыцарь в обсидиановых доспехах с сияющими глазами. Задачи A и S ранга выполняются на одном дыхании.',
        nextUnlock: 66
      },
      {
        tier: 5,
        minLevel: 66,
        maxLevel: 999,
        name: 'Абсолютный Теневой Гигачад Монарх',
        race: 'Раса: Бог Дисциплины и Продуктивности',
        icon: '👑',
        description: 'Высшая форма эволюции! Восседает на троне с армией теней. Ни одна задача в мире не способна устоять перед твоим фокусом.',
        nextUnlock: null
      }
    ];

    const currentTier = tiers.find(t => level >= t.minLevel && level <= t.maxLevel) || tiers[tiers.length - 1];
    return { currentTier, allTiers: tiers };
  }
}
