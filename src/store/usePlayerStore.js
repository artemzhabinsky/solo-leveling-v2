/**
 * Reactive Player & System State Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyXp, xpRequiredForLevel } from '../domain/xp.js';
import { getLocalDateStr } from '../utils/dateUtils.js';

export const DEFAULT_STATS = {
  strength: 0,     // STR (Physical)
  intelligence: 0, // INT (Mental)
  vitality: 0,     // VIT (Spirit)
  goldBonus: 0,    // GOLD (Finance)
  sense: 0         // SEN (Discipline)
};

export const usePlayerStore = create()(
  persist(
    (set, get) => ({
      name: 'Сон Джин-Ву',
      level: 1,
      xp: 0,
      gold: 665,
      totalGoldEarned: 665,
      hp: 3,
      hasShield: false,
      activeTitle: 'Пробуждённый',
      unlockedTitles: ['Пробуждённый'],
      stats: { ...DEFAULT_STATS },
      dailyStreak: 3,
      lastHpCheckDate: getLocalDateStr(),
      analyticsLogs: [],
      systemEvents: [],
      showDeathModal: false,
      hasFixedBalance665: false,

      setName: (newName) => set({ name: newName }),

      healHp: (amount = 1) => {
        const currentHp = get().hp;
        if (currentHp >= 3) return false;
        set({ hp: Math.min(3, currentHp + amount) });
        return true;
      },

      activateShield: () => set({ hasShield: true }),

      consumeShield: () => {
        const { hasShield } = get();
        if (hasShield) {
          set({ hasShield: false });
          return true;
        }
        return false;
      },

      equipTitle: (titleStr) => {
        const { unlockedTitles } = get();
        if (unlockedTitles.includes(titleStr)) {
          set({ activeTitle: titleStr });
        }
      },

      unlockTitle: (titleStr) => {
        const { unlockedTitles } = get();
        if (!unlockedTitles.includes(titleStr)) {
          set({ unlockedTitles: [...unlockedTitles, titleStr] });
        }
      },

      fixBalanceTo665: () => {
        set({ gold: 665, totalGoldEarned: 665, hasFixedTotalGold665: true });
      },

      // Automatic Daily HP Loss Penalty Check for Missed Days
      checkMissedDailyQuests: (quests = []) => {
        const state = get();
        const todayStr = getLocalDateStr();
        const lastCheck = state.lastHpCheckDate || todayStr;

        if (lastCheck === todayStr) return;

        const lastDateObj = new Date(lastCheck);
        const todayObj = new Date(todayStr);
        const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 3600 * 24));

        if (diffDays > 0) {
          // Check if daily quests were completed yesterday
          const yesterdayObj = new Date();
          yesterdayObj.setDate(yesterdayObj.getDate() - 1);
          const yesterdayStr = getLocalDateStr(yesterdayObj);

          const completedYesterday = quests.some(q => q.lastCompletedDate === yesterdayStr);

          if (!completedYesterday && quests.length > 0) {
            // Deduct HP for missed days
            const penaltyHp = Math.min(3, diffDays);
            get().deductHp(penaltyHp);
          }

          set({ lastHpCheckDate: todayStr });
        }
      },

      awardXpAndGold: (baseXp, baseGold, categoryKey = 'mental') => {
        const state = get();
        const intMult = 1 + (state.stats.intelligence * 0.02);
        const strMult = 1 + (state.stats.goldBonus * 0.02);
        const senseChance = state.stats.sense * 0.015;

        const isCritical = Math.random() < senseChance;
        const critMult = isCritical ? 2.0 : 1.0;

        const finalXp = Math.round(baseXp * intMult * critMult);
        const finalGold = Math.round(baseGold * strMult * critMult);

        const xpResult = applyXp(state.level, state.xp, finalXp);

        // Automate Stat Growth based on completed task category!
        const attrMap = {
          physical: 'strength',
          mental: 'intelligence',
          spirit: 'vitality',
          finance: 'goldBonus',
          discipline: 'sense'
        };
        const targetAttr = attrMap[categoryKey] || 'intelligence';
        
        const statBoost = xpResult.levelsGained > 0 ? xpResult.levelsGained : 0;
        const updatedStats = { ...state.stats };
        
        if (statBoost > 0) {
          Object.keys(updatedStats).forEach(key => {
            updatedStats[key] += statBoost;
          });
        }
        updatedStats[targetAttr] = (updatedStats[targetAttr] || 0) + 1;

        const todayStr = getLocalDateStr();
        const existingLogs = [...state.analyticsLogs];
        let todayLog = existingLogs.find(l => l.date === todayStr);

        if (!todayLog) {
          todayLog = { date: todayStr, xpGained: 0, goldGained: 0, tasksCompleted: 0, categoryBreakdown: {} };
          existingLogs.push(todayLog);
        }
        todayLog.xpGained += finalXp;
        todayLog.goldGained = (todayLog.goldGained || 0) + finalGold;
        todayLog.tasksCompleted += 1;
        todayLog.categoryBreakdown[categoryKey] = (todayLog.categoryBreakdown[categoryKey] || 0) + 1;

        set({
          level: xpResult.level,
          xp: xpResult.xp,
          gold: state.gold + finalGold,
          totalGoldEarned: state.totalGoldEarned + finalGold,
          stats: updatedStats,
          analyticsLogs: existingLogs
        });

        return {
          finalXp,
          finalGold,
          isCritical,
          leveledUp: xpResult.leveledUp,
          newLevel: xpResult.level
        };
      },

      // Revert awarded XP, Gold, Stats, and Analytics when unmarking a task!
      revertXpAndGold: (baseXp, baseGold, categoryKey = 'mental') => {
        const state = get();
        let newXp = state.xp - baseXp;
        let newLevel = state.level;

        while (newXp < 0 && newLevel > 1) {
          newLevel -= 1;
          newXp += xpRequiredForLevel(newLevel);
        }
        if (newLevel === 1 && newXp < 0) {
          newXp = 0;
        }

        const newGold = Math.max(0, state.gold - baseGold);
        const newTotalGold = Math.max(0, state.totalGoldEarned - baseGold);

        const attrMap = {
          physical: 'strength',
          mental: 'intelligence',
          spirit: 'vitality',
          finance: 'goldBonus',
          discipline: 'sense'
        };
        const targetAttr = attrMap[categoryKey] || 'intelligence';
        const updatedStats = { ...state.stats };
        updatedStats[targetAttr] = Math.max(0, (updatedStats[targetAttr] || 0) - 1);

        const todayStr = getLocalDateStr();
        const existingLogs = state.analyticsLogs.map(l => {
          if (l.date === todayStr) {
            const updatedBreakdown = { ...(l.categoryBreakdown || {}) };
            if (updatedBreakdown[categoryKey]) {
              updatedBreakdown[categoryKey] = Math.max(0, updatedBreakdown[categoryKey] - 1);
            }
            return {
              ...l,
              xpGained: Math.max(0, l.xpGained - baseXp),
              goldGained: Math.max(0, (l.goldGained || 0) - baseGold),
              tasksCompleted: Math.max(0, l.tasksCompleted - 1),
              categoryBreakdown: updatedBreakdown
            };
          }
          return l;
        });

        set({
          level: newLevel,
          xp: newXp,
          gold: newGold,
          totalGoldEarned: newTotalGold,
          stats: updatedStats,
          analyticsLogs: existingLogs
        });
      },

      deductHp: (amount = 1) => {
        const state = get();
        if (state.hasShield) {
          state.consumeShield();
          alert('🛡️ «Щит от Прокрастинации» сработал! Потеря HP заблокирована.');
          return;
        }

        const currentHp = state.hp;
        const newHp = Math.max(0, currentHp - amount);

        const penaltyEvent = {
          id: 'evt-' + Date.now(),
          eventType: 'penalty_hp_loss',
          occurredAt: new Date().toISOString()
        };

        if (newHp === 0) {
          get().triggerDeathReset();
        } else {
          set({
            hp: newHp,
            systemEvents: [...state.systemEvents, penaltyEvent]
          });
        }
      },

      triggerDeathReset: () => {
        const state = get();
        const deathEvent = {
          id: 'evt-' + Date.now(),
          eventType: 'penalty_reset',
          occurredAt: new Date().toISOString()
        };

        set({
          level: 1,
          xp: 0,
          gold: 0,
          hp: 3,
          hasShield: false,
          stats: { ...DEFAULT_STATS },
          systemEvents: [...state.systemEvents, deathEvent],
          showDeathModal: true
        });
      },

      dismissDeathModal: () => set({ showDeathModal: false }),

      spendGold: (amount) => {
        const { gold } = get();
        if (gold >= amount) {
          set({ gold: gold - amount });
          return true;
        }
        return false;
      },

      resetProgress: () => {
        set({
          level: 1,
          xp: 0,
          gold: 665,
          totalGoldEarned: 665,
          hp: 3,
          hasShield: false,
          activeTitle: 'Пробуждённый',
          unlockedTitles: ['Пробуждённый'],
          stats: { ...DEFAULT_STATS },
          dailyStreak: 3,
          analyticsLogs: [],
          systemEvents: []
        });
      }
    }),
    {
      name: 'SOLO_LEVELING_PLAYER_STORE_V2'
    }
  )
);
