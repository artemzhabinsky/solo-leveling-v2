/**
 * Central State Management & Persistence Store
 */

const STORAGE_KEY = 'SOLO_LEVELING_SYSTEM_DATA_V1';

export class SystemState {
  constructor() {
    this.data = this.loadState();
  }

  // Calculate XP required for next level
  static getRequiredXP(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
  }

  // Calculate Rank Title based on level
  static getRankInfo(level) {
    if (level >= 100) return { rank: 'MONARCH', title: 'Теневой Монарх (Shadow Monarch)' };
    if (level >= 81) return { rank: 'S', title: 'Охотник S-Ранга (S-Rank Hunter)' };
    if (level >= 61) return { rank: 'A', title: 'Командир A-Ранга (A-Rank Hunter)' };
    if (level >= 41) return { rank: 'B', title: 'Авангард B-Ранга (B-Rank Hunter)' };
    if (level >= 26) return { rank: 'C', title: 'Боец C-Ранга (C-Rank Hunter)' };
    if (level >= 11) return { rank: 'D', title: 'Искатель D-Ранга (D-Rank Hunter)' };
    return { rank: 'E', title: 'Новичок E-Ранга (E-Rank Hunter)' };
  }

  // Load from localStorage or initialize defaults
  loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse state, creating initial', e);
      }
    }
    return this.getDefaultState();
  }

  // Save current state to localStorage
  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getDefaultState() {
    return {
      player: {
        name: 'Сон Джин-Ву',
        level: 1,
        xp: 0,
        gold: 150,
        statPoints: 5,
        stats: {
          strength: 10,     // +% Gold gain
          agility: 10,      // +% Speed bonus XP
          sense: 10,        // +% Critical double reward chance
          vitality: 10,     // Daily Streak protection
          intelligence: 10  // +% XP gain
        },
        dailyStreak: 3,
        lastDailyCheck: new Date().toISOString().split('T')[0]
      },
      categories: [
        { id: 'cat-health', name: '🏋️ Здоровье & Спорт', color: '#00ff88' },
        { id: 'cat-work', name: '💻 Работа & Кодинг', color: '#00f0ff' },
        { id: 'cat-study', name: '📚 Обучение & Книги', color: '#8a2be2' },
        { id: 'cat-life', name: '🏠 Быт & Личное', color: '#ffd700' }
      ],
      tasks: [
        {
          id: 'task-1',
          title: 'Провести ревью архитектуры приложения',
          description: 'Проверить структуру модулей и подсистем.',
          categoryId: 'cat-work',
          priority: 'B', // E, D, C, B, A, S
          status: 'todo', // todo, in_progress, completed
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          rewardXp: 400,
          rewardGold: 200,
          completedAt: null
        },
        {
          id: 'task-2',
          title: 'Утренняя тренировка: 50 отжиманий и 50 приседаний',
          description: 'Зарядка для поддержания формы.',
          categoryId: 'cat-health',
          priority: 'C',
          status: 'in_progress',
          dueDate: new Date().toISOString().split('T')[0],
          rewardXp: 200,
          rewardGold: 100,
          completedAt: null
        },
        {
          id: 'task-3',
          title: 'Прочитать 20 страниц книги по продуктивности',
          description: 'Изучить главу про управление фокусом.',
          categoryId: 'cat-study',
          priority: 'D',
          status: 'completed',
          dueDate: new Date().toISOString().split('T')[0],
          rewardXp: 100,
          rewardGold: 50,
          completedAt: new Date().toISOString()
        }
      ],
      dailyQuests: [
        { id: 'dq-1', title: '100 Отжиманий', xp: 50, gold: 30, completed: false },
        { id: 'dq-2', title: '100 Пресса', xp: 50, gold: 30, completed: false },
        { id: 'dq-3', title: '100 Приседаний', xp: 50, gold: 30, completed: false },
        { id: 'dq-4', title: '10 км Бег / 30 мин Прогулка', xp: 100, gold: 60, completed: false }
      ],
      shopItems: [
        {
          id: 'shop-1',
          title: '1 Час любимой видеоигры',
          description: 'Отдохнуть и поиграть без угрызений совести.',
          icon: '🎮',
          price: 150,
          category: 'Отдых'
        },
        {
          id: 'shop-2',
          title: 'Заказать любимую пиццу',
          description: 'Вкусный ужин за зачистку дневных квестов.',
          icon: '🍕',
          price: 400,
          category: 'Еда'
        },
        {
          id: 'shop-3',
          title: 'Просмотр фильма / серии сериала',
          description: 'Расслабляющий вечер за кино.',
          icon: '🎬',
          price: 200,
          category: 'Развлечения'
        },
        {
          id: 'shop-4',
          title: 'Покупка новой вещи / Гаджета',
          description: 'Крупная награда за выполнение A/S-Ранг задач.',
          icon: '🎁',
          price: 2000,
          category: 'Шопинг'
        }
      ],
      inventory: [
        {
          id: 'inv-1',
          itemId: 'shop-3',
          title: 'Просмотр фильма / серии сериала',
          icon: '🎬',
          purchasedAt: new Date().toISOString()
        }
      ]
    };
  }

  // Allocate Stat Point
  allocateStat(statName) {
    if (this.data.player.statPoints > 0 && this.data.player.stats[statName] !== undefined) {
      this.data.player.stats[statName] += 1;
      this.data.player.statPoints -= 1;
      this.save();
      return true;
    }
    return false;
  }

  // Calculate XP & Gold Rewards with Player Stat Multipliers
  calculateRewards(baseXp, baseGold) {
    const intBonus = 1 + (this.data.player.stats.intelligence * 0.02); // +2% XP per Int
    const strBonus = 1 + (this.data.player.stats.strength * 0.02);     // +2% Gold per Str
    const senseChance = this.data.player.stats.sense * 0.015;          // 1.5% Crit chance per Sense

    const isCritical = Math.random() < senseChance;
    const critMult = isCritical ? 2.0 : 1.0;

    const finalXp = Math.round(baseXp * intBonus * critMult);
    const finalGold = Math.round(baseGold * strBonus * critMult);

    return { finalXp, finalGold, isCritical };
  }

  // Add XP and handle Level Ups
  addXpAndGold(xpAmount, goldAmount) {
    let levelsGained = 0;
    this.data.player.xp += xpAmount;
    this.data.player.gold += goldAmount;

    let reqXp = SystemState.getRequiredXP(this.data.player.level);
    while (this.data.player.xp >= reqXp) {
      this.data.player.xp -= reqXp;
      this.data.player.level += 1;
      this.data.player.statPoints += 5;
      levelsGained += 1;
      reqXp = SystemState.getRequiredXP(this.data.player.level);
    }

    this.save();
    return { levelsGained, newLevel: this.data.player.level, newStatPoints: this.data.player.statPoints };
  }

  // Task Actions
  addTask(task) {
    this.data.tasks.unshift(task);
    this.save();
  }

  updateTaskStatus(taskId, newStatus) {
    const task = this.data.tasks.find(t => t.id === taskId);
    if (!task) return null;

    const wasCompleted = task.status === 'completed';
    task.status = newStatus;

    if (newStatus === 'completed' && !wasCompleted) {
      task.completedAt = new Date().toISOString();
      const reward = this.calculateRewards(task.rewardXp, task.rewardGold);
      const levelUpResult = this.addXpAndGold(reward.finalXp, reward.finalGold);
      return { reward, levelUpResult, task };
    } else {
      this.save();
      return null;
    }
  }

  deleteTask(taskId) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== taskId);
    this.save();
  }

  // Shop Actions
  addShopItem(item) {
    this.data.shopItems.unshift(item);
    this.save();
  }

  buyShopItem(itemId) {
    const item = this.data.shopItems.find(i => i.id === itemId);
    if (!item) return { success: false, message: 'Предмет не найден' };

    if (this.data.player.gold < item.price) {
      return { success: false, message: 'Недостаточно золотых монет!' };
    }

    this.data.player.gold -= item.price;
    const invItem = {
      id: 'inv-' + Date.now(),
      itemId: item.id,
      title: item.title,
      icon: item.icon,
      purchasedAt: new Date().toISOString()
    };
    this.data.inventory.unshift(invItem);
    this.save();

    return { success: true, invItem, remainingGold: this.data.player.gold };
  }

  // Daily Quests Toggle
  toggleDailyQuest(questId) {
    const quest = this.data.dailyQuests.find(q => q.id === questId);
    if (!quest) return null;

    quest.completed = !quest.completed;
    let rewardResult = null;

    if (quest.completed) {
      const reward = this.calculateRewards(quest.xp, quest.gold);
      const levelUpResult = this.addXpAndGold(reward.finalXp, reward.finalGold);
      rewardResult = { reward, levelUpResult };
    } else {
      this.save();
    }

    // Check if all daily quests are completed
    const allDone = this.data.dailyQuests.every(q => q.completed);
    if (allDone) {
      // Bonus daily completion reward
      const bonusXp = 150;
      const bonusGold = 100;
      const levelUpResult = this.addXpAndGold(bonusXp, bonusGold);
      rewardResult = rewardResult || { reward: { finalXp: bonusXp, finalGold: bonusGold, isCritical: false }, levelUpResult };
    }

    return rewardResult;
  }

  // Export / Import JSON
  exportData() {
    return JSON.stringify(this.data, null, 2);
  }

  importData(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.player && parsed.tasks) {
        this.data = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON data', e);
    }
    return false;
  }

  resetAll() {
    this.data = this.getDefaultState();
    this.save();
  }
}

export const store = new SystemState();
