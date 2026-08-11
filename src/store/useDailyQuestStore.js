/**
 * Daily Quests Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getLocalDateStr } from '../utils/dateUtils.js';

export const useDailyQuestStore = create()(
  persist(
    (set, get) => ({
      quests: [
        { id: 'daily-1', title: 'Отжимания: 100 повторений', xp: 100, coins: 20, lastCompletedDate: null, lastEarnedXp: 100, lastEarnedGold: 20 },
        { id: 'daily-2', title: 'Приседания: 100 повторений', xp: 100, coins: 20, lastCompletedDate: null, lastEarnedXp: 100, lastEarnedGold: 20 },
        { id: 'daily-3', title: 'Бег: 10 километров', xp: 150, coins: 30, lastCompletedDate: null, lastEarnedXp: 150, lastEarnedGold: 30 },
        { id: 'daily-4', title: 'Чтение: 30 минут фокуса', xp: 80, coins: 15, lastCompletedDate: null, lastEarnedXp: 80, lastEarnedGold: 15 }
      ],

      addQuest: (title, xp = 100, coins = 20) => {
        const newQuest = {
          id: 'daily-' + Date.now(),
          title,
          xp: Number(xp) || 100,
          coins: Number(coins) || 20,
          lastCompletedDate: null,
          lastEarnedXp: Number(xp) || 100,
          lastEarnedGold: Number(coins) || 20
        };
        set((state) => ({ quests: [...state.quests, newQuest] }));
      },

      setQuestLastEarned: (questId, lastEarnedXp, lastEarnedGold) => {
        const { quests } = get();
        set({
          quests: quests.map(q => q.id === questId ? { ...q, lastEarnedXp, lastEarnedGold } : q)
        });
      },

      toggleQuestCompleted: (questId) => {
        const { quests } = get();
        const todayStr = getLocalDateStr();
        const quest = quests.find(q => q.id === questId);
        if (!quest) return null;

        const isDoneToday = quest.lastCompletedDate === todayStr;
        const nextDate = isDoneToday ? null : todayStr;

        set({
          quests: quests.map(q => q.id === questId ? { ...q, lastCompletedDate: nextDate } : q)
        });

        return { quest, justCompleted: !isDoneToday };
      },

      deleteQuest: (questId) => {
        set((state) => ({ quests: state.quests.filter(q => q.id !== questId) }));
      }
    }),
    {
      name: 'SOLO_LEVELING_DAILY_QUEST_STORE'
    }
  )
);
