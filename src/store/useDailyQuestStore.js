/**
 * Daily Quests Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useDailyQuestStore = create()(
  persist(
    (set, get) => ({
      quests: [
        { id: 'dq-1', title: '100 Отжиманий', xp: 50, coins: 15, lastCompletedDate: null },
        { id: 'dq-2', title: '100 Пресса', xp: 50, coins: 15, lastCompletedDate: null },
        { id: 'dq-3', title: '100 Приседаний', xp: 50, coins: 15, lastCompletedDate: null },
        { id: 'dq-4', title: '10 км Бег / 30 мин Прогулка', xp: 100, coins: 30, lastCompletedDate: null }
      ],

      toggleQuestCompleted: (questId) => {
        const { quests } = get();
        const todayStr = new Date().toISOString().split('T')[0];
        const quest = quests.find(q => q.id === questId);

        if (!quest) return null;

        const isCurrentlyDoneToday = quest.lastCompletedDate === todayStr;
        const newCompletedDate = isCurrentlyDoneToday ? null : todayStr;

        const updatedQuest = { ...quest, lastCompletedDate: newCompletedDate };
        set({
          quests: quests.map(q => q.id === questId ? updatedQuest : q)
        });

        const justCompleted = !isCurrentlyDoneToday;
        return { quest: updatedQuest, justCompleted };
      },

      addQuest: (title, xp = 50, coins = 15) => {
        const newQuest = {
          id: 'dq-' + Date.now(),
          title,
          xp,
          coins,
          lastCompletedDate: null
        };
        set((state) => ({ quests: [...state.quests, newQuest] }));
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
