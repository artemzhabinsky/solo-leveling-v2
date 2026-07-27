/**
 * Task Tracker Controller (List, Kanban, Calendar, Daily Quests)
 */
import { store } from './state.js';
import { ui } from './ui.js';
import { sound } from './sound.js';

export class TaskManager {
  constructor() {
    this.currentView = 'list'; // list, kanban, calendar
    this.filterCategory = 'all';
    this.filterPriority = 'all';
    this.searchQuery = '';
  }

  init() {
    this.renderView();
    this.renderDailyQuests();
    this.bindEvents();
  }

  getFilteredTasks() {
    return store.data.tasks.filter(t => {
      const matchCat = this.filterCategory === 'all' || t.categoryId === this.filterCategory;
      const matchPri = this.filterPriority === 'all' || t.priority === this.filterPriority;
      const matchQuery = !this.searchQuery || t.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchPri && matchQuery;
    });
  }

  renderView() {
    const listSec = document.getElementById('tasks-view-list');
    const kanbanSec = document.getElementById('tasks-view-kanban');
    const calendarSec = document.getElementById('tasks-view-calendar');

    if (listSec) listSec.style.display = this.currentView === 'list' ? 'flex' : 'none';
    if (kanbanSec) kanbanSec.style.display = this.currentView === 'kanban' ? 'grid' : 'none';
    if (calendarSec) calendarSec.style.display = this.currentView === 'calendar' ? 'block' : 'none';

    if (this.currentView === 'list') this.renderListView();
    if (this.currentView === 'kanban') this.renderKanbanView();
    if (this.currentView === 'calendar') this.renderCalendarView();
  }

  // Render List View
  renderListView() {
    const container = document.getElementById('tasks-view-list');
    if (!container) return;

    const filtered = this.getFilteredTasks();
    if (filtered.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 40px;">Задач не найдено. Нажмите "+ Новая Задача", чтобы добавить!</div>`;
      return;
    }

    container.innerHTML = filtered.map(t => {
      const cat = store.data.categories.find(c => c.id === t.categoryId);
      const isCompleted = t.status === 'completed';

      return `
        <div class="task-item-card ${isCompleted ? 'completed' : ''}" data-id="${t.id}">
          <div class="task-checkbox-custom btn-toggle-task" data-id="${t.id}">
            ${isCompleted ? '✓' : ''}
          </div>
          <div class="task-content-main">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="rank-badge rank-${t.priority}" style="font-size: 11px; padding: 2px 6px;">${t.priority}-RANK</span>
              <span class="task-title">${this.escapeHtml(t.title)}</span>
            </div>
            ${t.description ? `<div style="font-size: 12px; color: var(--text-dim); margin-top: 2px;">${this.escapeHtml(t.description)}</div>` : ''}
            <div class="task-meta-row" style="margin-top: 6px;">
              ${cat ? `<span class="category-tag" style="color:${cat.color}; border-color:${cat.color}40; background:${cat.color}15;">${cat.name}</span>` : ''}
              <span>📅 ${t.dueDate || 'Без даты'}</span>
            </div>
          </div>
          <div class="rewards-pill">
            <span class="xp-gain">+${t.rewardXp} XP</span>
            <span class="gold-gain">+${t.rewardGold} 🪙</span>
          </div>
          <button class="btn-system btn-danger btn-delete-task" data-id="${t.id}" style="padding: 6px 10px; font-size: 12px;">🗑️</button>
        </div>
      `;
    }).join('');

    this.bindTaskItemEvents();
  }

  // Render Kanban View
  renderKanbanView() {
    const columns = {
      todo: document.getElementById('kanban-col-todo'),
      in_progress: document.getElementById('kanban-col-in_progress'),
      completed: document.getElementById('kanban-col-completed')
    };

    if (!columns.todo) return;

    Object.values(columns).forEach(col => col.innerHTML = '');

    const filtered = this.getFilteredTasks();
    filtered.forEach(t => {
      const cat = store.data.categories.find(c => c.id === t.categoryId);
      const card = document.createElement('div');
      card.className = `task-item-card ${t.status === 'completed' ? 'completed' : ''}`;
      card.style.flexDirection = 'column';
      card.style.alignItems = 'flex-start';
      card.setAttribute('draggable', 'true');
      card.setAttribute('data-id', t.id);

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <span class="rank-badge rank-${t.priority}" style="font-size: 10px; padding: 2px 6px;">${t.priority}-RANK</span>
          <div class="rewards-pill" style="font-size: 10px; padding: 2px 6px;">
            <span class="xp-gain">+${t.rewardXp} XP</span>
            <span class="gold-gain">+${t.rewardGold} 🪙</span>
          </div>
        </div>
        <div class="task-title" style="margin-top: 6px;">${this.escapeHtml(t.title)}</div>
        <div class="task-meta-row" style="margin-top: 6px;">
          ${cat ? `<span class="category-tag" style="color:${cat.color}">${cat.name}</span>` : ''}
        </div>
        <div style="display: flex; gap: 8px; margin-top: 10px; width: 100%; justify-content: flex-end;">
          <button class="btn-system btn-toggle-task" data-id="${t.id}" style="padding: 4px 8px; font-size: 11px;">
            ${t.status === 'completed' ? '↩️ Отменить' : '✓ Завершить'}
          </button>
        </div>
      `;

      if (columns[t.status]) {
        columns[t.status].appendChild(card);
      }
    });

    this.bindKanbanDragDrop();
    this.bindTaskItemEvents();
  }

  // Render Calendar View
  renderCalendarView() {
    const grid = document.getElementById('calendar-grid-days');
    if (!grid) return;

    grid.innerHTML = '';
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    // Day headers
    const weekDays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    weekDays.forEach(d => {
      grid.innerHTML += `<div class="calendar-day-head">${d}</div>`;
    });

    // Empty lead cells
    for (let i = 0; i < firstDayIndex; i++) {
      grid.innerHTML += `<div class="calendar-day-cell" style="opacity: 0.2;"></div>`;
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = day === today.getDate();
      const dayTasks = store.data.tasks.filter(t => t.dueDate === dateStr);

      grid.innerHTML += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}">
          <div class="calendar-day-num">${day}</div>
          ${dayTasks.map(t => `
            <div class="calendar-task-dot" title="${t.title}">
              ${t.status === 'completed' ? '✓ ' : ''}${t.title}
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  // Render Daily Quests Log
  renderDailyQuests() {
    const container = document.getElementById('daily-quests-container');
    const streakEl = document.getElementById('daily-streak-num');

    if (streakEl) streakEl.textContent = store.data.player.dailyStreak;
    if (!container) return;

    container.innerHTML = store.data.dailyQuests.map(q => `
      <div class="task-item-card ${q.completed ? 'completed' : ''}" style="border-color: rgba(138, 43, 226, 0.3);">
        <div class="task-checkbox-custom btn-toggle-daily" data-id="${q.id}" style="border-color: var(--system-purple);">
          ${q.completed ? '✓' : ''}
        </div>
        <div class="task-content-main">
          <div class="task-title" style="color: #e2f1ff;">${this.escapeHtml(q.title)}</div>
        </div>
        <div class="rewards-pill">
          <span class="xp-gain">+${q.xp} XP</span>
          <span class="gold-gain">+${q.gold} 🪙</span>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-toggle-daily').forEach(btn => {
      btn.addEventListener('click', () => {
        const qId = btn.getAttribute('data-id');
        const res = store.toggleDailyQuest(qId);
        sound.playQuestComplete();
        ui.renderHeader();
        this.renderDailyQuests();

        if (res && res.reward) {
          ui.showToast('КВЕСТ ВЫПОЛНЕН! ⚔️', `+${res.reward.finalXp} XP  +${res.reward.finalGold} 🪙`, res.reward.isCritical);
          if (res.levelUpResult && res.levelUpResult.levelsGained > 0) {
            ui.showLevelUpModal(res.levelUpResult.newLevel, res.levelUpResult.newStatPoints);
          }
        }
      });
    });
  }

  bindTaskItemEvents() {
    // Toggle completed status
    document.querySelectorAll('.btn-toggle-task').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const task = store.data.tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        const res = store.updateTaskStatus(id, newStatus);

        if (newStatus === 'completed') sound.playQuestComplete();

        ui.renderHeader();
        this.renderView();

        if (res && res.reward) {
          const critText = res.reward.isCritical ? '⚡ КРИТИЧЕСКАЯ НАГРАДА (x2)!' : '';
          ui.showToast(`ЗАДАЧА ЗАВЕРШЕНА! ${critText}`, `+${res.reward.finalXp} XP  +${res.reward.finalGold} 🪙`, res.reward.isCritical);

          if (res.levelUpResult && res.levelUpResult.levelsGained > 0) {
            ui.showLevelUpModal(res.levelUpResult.newLevel, res.levelUpResult.newStatPoints);
          }
        }
      };
    });

    // Delete task
    document.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        store.deleteTask(id);
        this.renderView();
      };
    });
  }

  bindKanbanDragDrop() {
    const cards = document.querySelectorAll('.kanban-cards-container .task-item-card');
    const cols = document.querySelectorAll('.kanban-cards-container');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', card.getAttribute('data-id'));
      });
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => e.preventDefault());
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const newStatus = col.getAttribute('data-status');
        if (taskId && newStatus) {
          const res = store.updateTaskStatus(taskId, newStatus);
          if (newStatus === 'completed') sound.playQuestComplete();
          ui.renderHeader();
          this.renderView();

          if (res && res.reward) {
            ui.showToast('ЗАДАЧА ВЫПОЛНЕНА! 🎯', `+${res.reward.finalXp} XP  +${res.reward.finalGold} 🪙`, res.reward.isCritical);
            if (res.levelUpResult && res.levelUpResult.levelsGained > 0) {
              ui.showLevelUpModal(res.levelUpResult.newLevel, res.levelUpResult.newStatPoints);
            }
          }
        }
      });
    });
  }

  bindEvents() {
    // View switch buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.getAttribute('data-view');
        this.renderView();
      });
    });

    // Category filter
    const selectCat = document.getElementById('filter-category');
    if (selectCat) {
      selectCat.addEventListener('change', () => {
        this.filterCategory = selectCat.value;
        this.renderView();
      });
    }

    // Priority filter
    const selectPri = document.getElementById('filter-priority');
    if (selectPri) {
      selectPri.addEventListener('change', () => {
        this.filterPriority = selectPri.value;
        this.renderView();
      });
    }

    // Search input
    const inputSearch = document.getElementById('input-task-search');
    if (inputSearch) {
      inputSearch.addEventListener('input', () => {
        this.searchQuery = inputSearch.value;
        this.renderView();
      });
    }

    // Create Task Modal events
    const btnOpenNew = document.getElementById('btn-open-new-task');
    const modalNew = document.getElementById('task-modal-overlay');
    const btnCloseNew = document.getElementById('btn-close-task-modal');
    const formNew = document.getElementById('form-create-task');

    if (btnOpenNew && modalNew) {
      btnOpenNew.addEventListener('click', () => {
        this.populateCategorySelect();
        modalNew.classList.add('active');
      });
    }
    if (btnCloseNew && modalNew) {
      btnCloseNew.addEventListener('click', () => modalNew.classList.remove('active'));
    }

    if (formNew) {
      formNew.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-input-title').value.trim();
        const description = document.getElementById('task-input-desc').value.trim();
        const categoryId = document.getElementById('task-select-category').value;
        const priority = document.getElementById('task-select-priority').value;
        const dueDate = document.getElementById('task-input-date').value;

        if (!title) return;

        // Auto calculate XP and Gold rewards based on Priority Rank
        const rewardMap = {
          E: { xp: 50, gold: 25 },
          D: { xp: 100, gold: 50 },
          C: { xp: 200, gold: 100 },
          B: { xp: 400, gold: 200 },
          A: { xp: 800, gold: 450 },
          S: { xp: 1500, gold: 1000 }
        };

        const rew = rewardMap[priority] || rewardMap.C;

        const newTask = {
          id: 'task-' + Date.now(),
          title,
          description,
          categoryId,
          priority,
          status: 'todo',
          dueDate: dueDate || new Date().toISOString().split('T')[0],
          rewardXp: rew.xp,
          rewardGold: rew.gold,
          completedAt: null
        };

        store.addTask(newTask);
        formNew.reset();
        modalNew.classList.remove('active');
        this.renderView();
        ui.showToast('КВЕСТ ДОБАВЛЕН 📜', `Задача "${title}" принята к исполнению!`);
      });
    }
  }

  populateCategorySelect() {
    const sel = document.getElementById('task-select-category');
    if (!sel) return;
    sel.innerHTML = store.data.categories.map(c => `
      <option value="${c.id}">${c.name}</option>
    `).join('');

    const filterSel = document.getElementById('filter-category');
    if (filterSel) {
      filterSel.innerHTML = `<option value="all">Все Категории</option>` + store.data.categories.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

export const taskMgr = new TaskManager();
