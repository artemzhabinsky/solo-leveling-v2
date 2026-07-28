/**
 * Tasks Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRewardForRank } from '../domain/rewards.js';

export const useTaskStore = create()(
  persist(
    (set, get) => ({
      tasks: [
        {
          id: 'task-1',
          title: 'Провести ревью архитектуры приложения',
          description: 'Проверить структуру модулей и подсистем.',
          category: 'mental',
          rank: 'B',
          xpReward: 500,
          coinReward: 100,
          status: 'urgent', // 'urgent', 'non_urgent', 'done'
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          completedAt: null
        },
        {
          id: 'task-2',
          title: 'Утренняя тренировка: 50 отжиманий и 50 приседаний',
          description: 'Зарядка для поддержания формы.',
          category: 'physical',
          rank: 'C',
          xpReward: 250,
          coinReward: 50,
          status: 'non_urgent',
          dueDate: new Date().toISOString().split('T')[0],
          completedAt: null
        },
        {
          id: 'task-3',
          title: 'Прочитать 20 страниц книги по продуктивности',
          description: 'Изучить главу про управление фокусом.',
          category: 'discipline',
          rank: 'D',
          xpReward: 100,
          coinReward: 20,
          status: 'done',
          dueDate: new Date().toISOString().split('T')[0],
          completedAt: new Date().toISOString()
        }
      ],
      currentView: 'list',
      filterCategory: 'all',
      filterRank: 'all',
      searchQuery: '',

      setView: (view) => set({ currentView: view }),
      setFilterCategory: (cat) => set({ filterCategory: cat }),
      setFilterRank: (rank) => set({ filterRank: rank }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addTask: (taskData) => {
        const reward = getRewardForRank(taskData.rank || 'C');
        const newTask = {
          id: 'task-' + Date.now(),
          title: taskData.title,
          description: taskData.description || '',
          category: taskData.category || 'mental',
          rank: taskData.rank || 'C',
          xpReward: reward.xp,
          coinReward: reward.coins,
          status: taskData.status || 'urgent',
          dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
          completedAt: null
        };

        set((state) => ({ tasks: [newTask, ...state.tasks] }));
        return newTask;
      },

      editTask: (taskId, updatedData) => {
        const { tasks } = get();
        const reward = getRewardForRank(updatedData.rank || 'C');
        
        set({
          tasks: tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                ...updatedData,
                xpReward: reward.xp,
                coinReward: reward.coins
              };
            }
            return t;
          })
        });
      },

      updateTaskStatus: (taskId, newStatus) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return null;

        const wasDone = task.status === 'done';
        const updatedTask = {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'done' ? new Date().toISOString() : null
        };

        set({
          tasks: tasks.map(t => t.id === taskId ? updatedTask : t)
        });

        return { task: updatedTask, justCompleted: newStatus === 'done' && !wasDone };
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));
      }
    }),
    {
      name: 'SOLO_LEVELING_TASKS_STORE'
    }
  )
);
