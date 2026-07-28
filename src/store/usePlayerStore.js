/**
 * Reactive Player & System State Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyXp, xpRequiredForLevel } from '../domain/xp.js';
import { getRankTitle } from '../domain/ranks.js';

export const usePlayerStore = create()(
  persist(
    (set, get) => ({
      name: 'Сон Джин-Ву',
      level: 1,
      xp: 0,
      gold: 150,
      hp: 3, // 0 to 3
      statPoints: 5,
      stats: {
        strength: 10,     // STR (Physical)
        intelligence: 10, // INT (Mental)
        vitality: 10,     // VIT (Spirit)
        goldBonus: 10,    // GOLD (Finance)
        sense: 10         // SEN (Discipline)
      },
      dailyStreak: 3,
      lastHpCheckDate: new Date().toISOString().split('T')[0],
      analyticsLogs: [], // { date, xpGained, tasksCompleted, categoryBreakdown }
      systemEvents: [],  // { id, eventType, occurredAt }
      showDeathModal: false,

      setName: (newName) => set({ name: newName }),

      allocateStat: (statName) => {
        const { statPoints, stats } = get();
        if (statPoints > 0 && stats[statName] !== undefined) {
          set({
            statPoints: statPoints - 1,
            stats: { ...stats, [statName]: stats[statName] + 1 }
          });
          return true;
        }
        return false;
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

        // Increment attribute matching the task category
        const attrMap = {
          physical: 'strength',
          mental: 'intelligence',
          spirit: 'vitality',
          finance: 'goldBonus',
          discipline: 'sense'
        };
        const targetAttr = attrMap[categoryKey] || 'intelligence';
        const updatedStats = { ...state.stats, [targetAttr]: state.stats[targetAttr] + 1 };

        // Log analytics data
        const todayStr = new Date().toISOString().split('T')[0];
        const existingLogs = [...state.analyticsLogs];
        let todayLog = existingLogs.find(l => l.date === todayStr);

        if (!todayLog) {
          todayLog = { date: todayStr, xpGained: 0, tasksCompleted: 0, categoryBreakdown: {} };
          existingLogs.push(todayLog);
        }
        todayLog.xpGained += finalXp;
        todayLog.tasksCompleted += 1;
        todayLog.categoryBreakdown[categoryKey] = (todayLog.categoryBreakdown[categoryKey] || 0) + 1;

        set({
          level: xpResult.level,
          xp: xpResult.xp,
          gold: state.gold + finalGold,
          statPoints: state.statPoints + (xpResult.levelsGained * 5),
          stats: updatedStats,
          analyticsLogs: existingLogs
        });

        return {
          finalXp,
          finalGold,
          isCritical,
          leveledUp: xpResult.leveledUp,
          newLevel: xpResult.level,
          statPointsGained: xpResult.levelsGained * 5
        };
      },

      deductHp: (amount = 1) => {
        const currentHp = get().hp;
        const newHp = Math.max(0, currentHp - amount);

        if (newHp === 0) {
          // Trigger Penalty Reset
          get().triggerDeathReset();
        } else {
          set({ hp: newHp });
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
          statPoints: 0,
          stats: { strength: 0, intelligence: 0, vitality: 0, goldBonus: 0, sense: 0 },
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
          gold: 150,
          hp: 3,
          statPoints: 5,
          stats: { strength: 10, intelligence: 10, vitality: 10, goldBonus: 10, sense: 10 },
          dailyStreak: 3,
          analyticsLogs: [],
          systemEvents: []
        });
      }
    }),
    {
      name: 'SOLO_LEVELING_PLAYER_STORE'
    }
  )
);
