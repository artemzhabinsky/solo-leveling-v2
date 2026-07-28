import React, { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { CATEGORIES } from '../../domain/categories.js';
import { sfx } from '../../services/audioService.js';
import { TodayCompletedModal } from '../modals/TodayCompletedModal.jsx';

export function TaskTrackerView({ onShowLevelUp }) {
  const {
    tasks,
    currentView,
    filterCategory,
    filterRank,
    searchQuery,
    setView,
    setFilterCategory,
    setFilterRank,
    setSearchQuery,
    addTask,
    editTask,
    updateTaskStatus,
    deleteTask
  } = useTaskStore();
  const { awardXpAndGold } = usePlayerStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isTodayCompletedModalOpen, setIsTodayCompletedModalOpen] = useState(false);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'mental',
    rank: 'C',
    status: 'urgent',
    dueDate: new Date().toISOString().split('T')[0]
  });

  const filteredTasks = tasks.filter(t => {
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    const matchRank = filterRank === 'all' || t.rank === filterRank;
    const matchQuery = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchRank && matchQuery;
  });

  const handleToggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'urgent' : 'done';
    const result = updateTaskStatus(taskId, newStatus);

    if (result && result.justCompleted) {
      sfx.playQuestComplete();
      const rewardResult = awardXpAndGold(task.xpReward, task.coinReward, task.category);
      if (rewardResult.leveledUp) {
        onShowLevelUp(rewardResult);
      }
      if (result.allTodayCompleted) {
        setIsTodayCompletedModalOpen(true);
      }
    }
  };

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    addTask(taskForm);
    setTaskForm({ title: '', description: '', category: 'mental', rank: 'C', status: 'urgent', dueDate: new Date().toISOString().split('T')[0] });
    setIsAddModalOpen(false);
  };

  const handleEditTaskSubmit = (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    editTask(editingTask.id, editingTask);
    setEditingTask(null);
  };

  // Drag & Drop Handlers for Kanban Board
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const result = updateTaskStatus(taskId, targetStatus);
    if (result && result.justCompleted) {
      sfx.playQuestComplete();
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const rewardResult = awardXpAndGold(task.xpReward, task.coinReward, task.category);
        if (rewardResult.leveledUp) {
          onShowLevelUp(rewardResult);
        }
      }
      if (result.allTodayCompleted) {
        setIsTodayCompletedModalOpen(true);
      }
    }
  };

  // Chronological Grouping Logic for List View (Сегодня, Завтра, На неделе, Потом)
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const weekEndObj = new Date();
  weekEndObj.setDate(weekEndObj.getDate() + 7);
  const weekEndStr = weekEndObj.toISOString().split('T')[0];

  const todayTasks = filteredTasks.filter(t => !t.dueDate || t.dueDate === todayStr);
  const tomorrowTasks = filteredTasks.filter(t => t.dueDate === tomorrowStr);
  const weekTasks = filteredTasks.filter(t => t.dueDate > tomorrowStr && t.dueDate <= weekEndStr);
  const laterTasks = filteredTasks.filter(t => t.dueDate > weekEndStr);

  // Planned vs Actual count for TODAY
  const todayPlannedCount = filteredTasks.filter(t => (t.originalDueDate || t.dueDate) === todayStr).length;
  const todayActualDoneCount = todayTasks.filter(t => t.status === 'done').length;

  const renderTaskCard = (t) => {
    const cat = CATEGORIES.find(c => c.key === t.category);
    const isDone = t.status === 'done';
    return (
      <div key={t.id} className={`task-item-card ${isDone ? 'completed' : ''}`}>
        <div onClick={() => handleToggleTask(t.id)} className="task-checkbox-custom">
          {isDone && '✓'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`rank-badge rank-${t.rank}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{t.rank}-RANK</span>
            <span className="task-title" style={{ fontSize: '15px', fontWeight: 600 }}>{t.title}</span>
          </div>
          {t.description && <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>{t.description}</div>}
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {cat && <span style={{ color: cat.color, fontWeight: 600 }}>{cat.label}</span>}
            <span>📅 {t.dueDate || 'Без даты'}</span>
          </div>
        </div>

        <div className="rewards-pill">
          <span className="xp-gain">+{t.xpReward} XP</span>
          <span className="gold-gain">+{t.coinReward} 🪙</span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setEditingTask(t)} className="btn-system" style={{ padding: '6px 10px', fontSize: '12px' }} title="Редактировать">✏️</button>
          <button onClick={() => deleteTask(t.id)} className="btn-system btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }} title="Удалить">🗑️</button>
        </div>
      </div>
    );
  };

  const renderTaskSection = (sectionTitle, sectionTasks, styleConfig, customCounterLabel = null) => {
    if (sectionTasks.length === 0) return null;

    // Sorting rule: Active tasks on top; Completed tasks on bottom sorted by completedAt descending (newest completed on top of closed stack)!
    const sortedTasks = [...sectionTasks].sort((a, b) => {
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';

      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;

      if (aDone && bDone) {
        const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });

    const doneCount = sectionTasks.filter(t => t.status === 'done').length;
    const totalCount = sectionTasks.length;
    const counterBadgeText = customCounterLabel !== null ? customCounterLabel : `${doneCount}/${totalCount}`;

    return (
      <div className="task-section-card-container" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <h3
            className="font-system"
            style={{
              color: styleConfig.color,
              opacity: styleConfig.opacity,
              textShadow: styleConfig.glow ? `0 0 12px ${styleConfig.color}` : 'none',
              fontSize: '18px',
              fontWeight: 800,
              letterSpacing: '1px'
            }}
          >
            {sectionTitle}
          </h3>
          <span
            style={{
              background: styleConfig.badgeBg,
              border: `1px solid ${styleConfig.badgeBorder}`,
              color: styleConfig.badgeColor,
              opacity: styleConfig.opacity,
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            {counterBadgeText}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedTasks.map(t => renderTaskCard(t))}
        </div>
      </div>
    );
  };

  const sectionStyles = {
    today: {
      color: '#00f0ff',
      opacity: 1.0,
      glow: true,
      badgeBg: 'rgba(0, 240, 255, 0.2)',
      badgeBorder: '#00f0ff',
      badgeColor: '#ffffff'
    },
    tomorrow: {
      color: '#00e5ff',
      opacity: 0.82,
      glow: false,
      badgeBg: 'rgba(0, 229, 255, 0.12)',
      badgeBorder: 'rgba(0, 229, 255, 0.4)',
      badgeColor: '#e2f1ff'
    },
    week: {
      color: '#5c9eff',
      opacity: 0.68,
      glow: false,
      badgeBg: 'rgba(92, 158, 255, 0.1)',
      badgeBorder: 'rgba(92, 158, 255, 0.3)',
      badgeColor: '#8ab4f8'
    },
    later: {
      color: '#5c78a3',
      opacity: 0.52,
      glow: false,
      badgeBg: 'rgba(92, 120, 163, 0.1)',
      badgeBorder: 'rgba(92, 120, 163, 0.25)',
      badgeColor: '#5c78a3'
    }
  };

  return (
    <div>
      <div className="task-controls-bar">
        <button onClick={() => setIsAddModalOpen(true)} className="btn-system">
          <span>+</span> НОВАЯ ЗАДАЧА
        </button>

        <div className="view-switcher">
          <button onClick={() => setView('list')} className={`view-btn ${currentView === 'list' ? 'active' : ''}`}>📋 Список</button>
          <button onClick={() => setView('kanban')} className={`view-btn ${currentView === 'kanban' ? 'active' : ''}`}>📌 Канбан</button>
          <button onClick={() => setView('calendar')} className={`view-btn ${currentView === 'calendar' ? 'active' : ''}`}>📅 Календарь</button>
        </div>

        <div className="filter-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="select-system" style={{ width: 'auto' }}>
            <option value="all">Все Категории</option>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          <select value={filterRank} onChange={(e) => setFilterRank(e.target.value)} className="select-system" style={{ width: 'auto' }}>
            <option value="all">Все Ранги</option>
            <option value="S">S-Rank (Мажор)</option>
            <option value="A">A-Rank (Важный)</option>
            <option value="B">B-Rank (Высокий)</option>
            <option value="C">C-Rank (Средний)</option>
            <option value="D">D-Rank (Обычный)</option>
            <option value="E">E-Rank (Легкий)</option>
          </select>

          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-system" placeholder="Поиск..." style={{ width: '180px' }} />
        </div>
      </div>

      {/* CHRONOLOGICAL GROUPED LIST VIEW */}
      {currentView === 'list' && (
        <div className="tasks-list-container" style={{ marginTop: '20px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>Задач не найдено. Нажмите "+ Новая Задача"!</div>
          ) : (
            <>
              {renderTaskSection('СЕГОДНЯ', todayTasks, sectionStyles.today, `${todayActualDoneCount}/${todayPlannedCount}`)}
              {renderTaskSection('ЗАВТРА', tomorrowTasks, sectionStyles.tomorrow)}
              {renderTaskSection('НА НЕДЕЛЕ', weekTasks, sectionStyles.week)}
              {renderTaskSection('ПОТОМ', laterTasks, sectionStyles.later)}
            </>
          )}
        </div>
      )}

      {/* KANBAN VIEW (3 COLUMNS: URGENT, NON-URGENT, DONE WITH DRAG & DROP) */}
      {currentView === 'kanban' && (
        <div className="kanban-board-grid" style={{ marginTop: '16px' }}>
          {[
            { key: 'urgent', title: '🔥 СРОЧНЫЕ' },
            { key: 'non_urgent', title: '⏳ НЕ СРОЧНЫЕ' },
            { key: 'done', title: '✅ ВЫПОЛНЕНО' }
          ].map((col) => (
            <div
              key={col.key}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="kanban-column-header">
                <span>{col.title} ({filteredTasks.filter(t => (t.status || 'urgent') === col.key).length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredTasks.filter(t => (t.status || 'urgent') === col.key).map(t => {
                  const cat = CATEGORIES.find(c => c.key === t.category);
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id)}
                      className={`task-item-card ${t.status === 'done' ? 'completed' : ''}`}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', cursor: 'grab', padding: '14px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span className={`rank-badge rank-${t.rank}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{t.rank}-RANK</span>
                        <div className="rewards-pill" style={{ fontSize: '10px', padding: '2px 6px' }}>
                          <span className="xp-gain">+{t.xpReward} XP</span>
                          <span className="gold-gain">+{t.coinReward} 🪙</span>
                        </div>
                      </div>
                      
                      <div className="task-title" style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600 }}>{t.title}</div>
                      {cat && <div style={{ fontSize: '11px', color: cat.color, marginTop: '4px', fontWeight: 600 }}>{cat.label}</div>}

                      <div style={{ display: 'flex', gap: '6px', marginTop: '12px', width: '100%', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingTask(t)} className="btn-system" style={{ padding: '4px 8px', fontSize: '11px' }}>✏️ Редактировать</button>
                        <button onClick={() => handleToggleTask(t.id)} className="btn-system" style={{ padding: '4px 8px', fontSize: '11px' }}>
                          {t.status === 'done' ? '↩️ Вернуть' : '✓ Завершить'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {currentView === 'calendar' && (
        <div className="calendar-view-container" style={{ marginTop: '16px', background: 'var(--bg-card)', border: 'var(--border-system)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="font-system text-glow" style={{ marginBottom: '16px', fontSize: '16px' }}>КАЛЕНДАРЬ КВЕСТОВ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--system-blue)', padding: '6px', fontWeight: 700 }}>{d}</div>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const dateStr = `2026-07-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.dueDate === dateStr);
              return (
                <div key={day} style={{ background: 'rgba(5,12,28,0.7)', border: '1px solid rgba(0,240,255,0.1)', minHeight: '70px', borderRadius: '6px', padding: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{day}</div>
                  {dayTasks.map(dt => (
                    <div key={dt.id} onClick={() => setEditingTask(dt)} style={{ fontSize: '11px', padding: '2px 4px', background: 'rgba(0,240,255,0.15)', borderRadius: '3px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}>
                      {dt.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '18px' }}>ПРИНЯТЬ НОВЫЙ КВЕСТ</h2>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleAddTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>НАЗВАНИЕ КВЕСТА</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="input-system" placeholder="Например: Закончить модуль..." required style={{ marginTop: '4px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>ОПИСАНИЕ</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="textarea-system" rows="3" placeholder="Подробное описание..." style={{ marginTop: '4px' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>КАТЕГОРИЯ</label>
                  <select value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>РАНГ ПРИОРИТЕТА</label>
                  <select value={taskForm.rank} onChange={(e) => setTaskForm({ ...taskForm, rank: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    <option value="C">C-Rank (250 XP, 50 🪙)</option>
                    <option value="E">E-Rank (50 XP, 10 🪙)</option>
                    <option value="D">D-Rank (100 XP, 20 🪙)</option>
                    <option value="B">B-Rank (500 XP, 100 🪙)</option>
                    <option value="A">A-Rank (1000 XP, 200 🪙)</option>
                    <option value="S">S-Rank (2500 XP, 500 🪙)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>СТАТУС КАНБАНА</label>
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    <option value="urgent">Срочные</option>
                    <option value="non_urgent">Не срочные</option>
                    <option value="done">Выполнено</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>СРОК ВЫПОЛНЕНИЯ</label>
                  <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="input-system" style={{ marginTop: '4px' }} />
                </div>
              </div>

              <button type="submit" className="btn-system" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                ДОБАВИТЬ В ЖУРНАЛ КВЕСТОВ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TASK POPUP MODAL */}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '18px' }}>✏️ РЕДАКТИРОВАТЬ КВЕСТ</h2>
              <button onClick={() => setEditingTask(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleEditTaskSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>НАЗВАНИЕ КВЕСТА</label>
                <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} className="input-system" required style={{ marginTop: '4px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>ОПИСАНИЕ</label>
                <textarea value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="textarea-system" rows="3" style={{ marginTop: '4px' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>КАТЕГОРИЯ</label>
                  <select value={editingTask.category} onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>РАНГ ПРИОРИТЕТА</label>
                  <select value={editingTask.rank} onChange={(e) => setEditingTask({ ...editingTask, rank: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    <option value="C">C-Rank (250 XP, 50 🪙)</option>
                    <option value="E">E-Rank (50 XP, 10 🪙)</option>
                    <option value="D">D-Rank (100 XP, 20 🪙)</option>
                    <option value="B">B-Rank (500 XP, 100 🪙)</option>
                    <option value="A">A-Rank (1000 XP, 200 🪙)</option>
                    <option value="S">S-Rank (2500 XP, 500 🪙)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>СТАТУС КАНБАНА</label>
                  <select value={editingTask.status || 'urgent'} onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    <option value="urgent">Срочные</option>
                    <option value="non_urgent">Не срочные</option>
                    <option value="done">Выполнено</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>СРОК ВЫПОЛНЕНИЯ</label>
                  <input type="date" value={editingTask.dueDate || ''} onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })} className="input-system" style={{ marginTop: '4px' }} />
                </div>
              </div>

              <button type="submit" className="btn-system" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                СОХРАНИТЬ ИЗМЕНЕНИЯ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TODAY ALL COMPLETED CELEBRATION MODAL */}
      <TodayCompletedModal
        isOpen={isTodayCompletedModalOpen}
        onClose={() => setIsTodayCompletedModalOpen(false)}
      />
    </div>
  );
}
