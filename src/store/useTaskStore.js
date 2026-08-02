/**
 * Tasks & Subtasks Store (Zustand)
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
          xpReward: 1000,
          coinReward: 200,
          status: 'urgent',
          dueDate: new Date().toISOString().split('T')[0],
          originalDueDate: new Date().toISOString().split('T')[0],
          completedAt: null,
          subtasks: [
            { id: 'sub-1', title: 'Проверить состояние стора Zustand', completed: true },
            { id: 'sub-2', title: 'Оптимизировать рендеринг списков', completed: false }
          ]
        },
        {
          id: 'task-2',
          title: 'Утренняя тренировка: 50 отжиманий и 50 приседаний',
          description: 'Зарядка для поддержания формы.',
          category: 'physical',
          rank: 'C',
          xpReward: 500,
          coinReward: 100,
          status: 'non_urgent',
          dueDate: new Date().toISOString().split('T')[0],
          originalDueDate: new Date().toISOString().split('T')[0],
          completedAt: null,
          subtasks: [
            { id: 'sub-3', title: 'Разминка 5 минут', completed: true },
            { id: 'sub-4', title: 'Отжимания 50 повторений', completed: false },
            { id: 'sub-5', title: 'Приседания 50 повторений', completed: false }
          ]
        },
        {
          id: 'task-3',
          title: 'Прочитать 20 страниц книги по продуктивности',
          description: 'Изучить главу про управление фокусом.',
          category: 'discipline',
          rank: 'D',
          xpReward: 200,
          coinReward: 40,
          status: 'done',
          dueDate: new Date().toISOString().split('T')[0],
          originalDueDate: new Date().toISOString().split('T')[0],
          completedAt: new Date().toISOString(),
          subtasks: []
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

      // Automatic Rollover for Overdue Unfinished Tasks to Today's Date
      rolloverOverdueTasks: () => {
        const { tasks } = get();
        const todayStr = new Date().toISOString().split('T')[0];
        let changed = false;

        const nextTasks = tasks.map(t => {
          if (t.status !== 'done' && t.dueDate && t.dueDate < todayStr) {
            changed = true;
            return {
              ...t,
              originalDueDate: t.originalDueDate || t.dueDate,
              dueDate: todayStr
            };
          }
          return t;
        });

        if (changed) {
          set({ tasks: nextTasks });
        }
      },

      addTask: (taskData) => {
        const reward = getRewardForRank(taskData.rank || 'C');
        const dueDate = taskData.dueDate || new Date().toISOString().split('T')[0];
        const newTask = {
          id: 'task-' + Date.now(),
          title: taskData.title,
          description: taskData.description || '',
          category: taskData.category || 'mental',
          rank: taskData.rank || 'C',
          xpReward: reward.xp,
          coinReward: reward.coins,
          status: taskData.status || 'urgent',
          dueDate: dueDate,
          originalDueDate: dueDate,
          completedAt: null,
          subtasks: taskData.subtasks || []
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

      toggleSubtask: (taskId, subtaskId) => {
        const { tasks } = get();
        set({
          tasks: tasks.map(t => {
            if (t.id === taskId && t.subtasks) {
              const updatedSubtasks = t.subtasks.map(s => 
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              );
              return { ...t, subtasks: updatedSubtasks };
            }
            return t;
          })
        });
      },

      updateTaskStatus: (taskId, newStatus) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return null;

        const todayStr = new Date().toISOString().split('T')[0];
        const wasDone = task.status === 'done';
        const isNowDone = newStatus === 'done';

        // Auto-transfer task to TODAY's date if completed today!
        const updatedTask = {
          ...task,
          status: newStatus,
          dueDate: isNowDone ? todayStr : task.originalDueDate || task.dueDate,
          completedAt: isNowDone ? new Date().toISOString() : null
        };

        const nextTasks = tasks.map(t => t.id === taskId ? updatedTask : t);
        set({ tasks: nextTasks });

        const todayPlanned = nextTasks.filter(t => (t.originalDueDate || t.dueDate) === todayStr);
        const allTodayPlannedDone = todayPlanned.length > 0 && todayPlanned.every(t => t.status === 'done');

        return {
          task: updatedTask,
          justCompleted: isNowDone && !wasDone,
          allTodayCompleted: isNowDone && allTodayPlannedDone
        };
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));
      }
    }),
    {
      name: 'SOLO_LEVELING_TASKS_STORE_V2',
      onRehydrateStorage: () => (state) => {
        if (state) state.rolloverOverdueTasks();
      }
    }
  )
);
