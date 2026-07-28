import React, { useState } from 'react';
import { useTaskStore } from '../../store/useTaskStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { CATEGORIES } from '../../domain/categories.js';
import { sfx } from '../../services/audioService.js';

export function TaskTrackerView({ onShowLevelUp }) {
  const { tasks, currentView, filterCategory, filterRank, searchQuery, setView, setFilterCategory, setFilterRank, setSearchQuery, addTask, updateTaskStatus, deleteTask } = useTaskStore();
  const { awardXpAndGold } = usePlayerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'mental',
    rank: 'C',
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

    const newStatus = task.status === 'done' ? 'todo' : 'done';
    const result = updateTaskStatus(taskId, newStatus);

    if (result && result.justCompleted) {
      sfx.playQuestComplete();
      const rewardResult = awardXpAndGold(task.xpReward, task.coinReward, task.category);
      if (rewardResult.leveledUp) {
        onShowLevelUp(rewardResult);
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    addTask(taskForm);
    setTaskForm({ title: '', description: '', category: 'mental', rank: 'C', dueDate: new Date().toISOString().split('T')[0] });
    setIsModalOpen(false);
  };

  return (
    <div>
      <div className="task-controls-bar">
        <button onClick={() => setIsModalOpen(true)} className="btn-system">
          <span>➕</span> НОВАЯ ЗАДАЧА
        </button>

        <div className="view-switcher">
          <button onClick={() => setView('list')} className={`view-btn ${currentView === 'list' ? 'active' : ''}`}>📋 Список</button>
          <button onClick={() => setView('kanban')} className={`view-btn ${currentView === 'kanban' ? 'active' : ''}`}>📌 Канбан</button>
          <button onClick={() => setView('calendar')} className={`view-btn ${currentView === 'calendar' ? 'active' : ''}`}>📅 Календарь</button>
        </div>

        <div className="filter-group">
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

      {/* LIST VIEW */}
      {currentView === 'list' && (
        <div className="tasks-list-container" style={{ marginTop: '16px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>Задач не найдено. Нажмите "+ Новая Задача"!</div>
          ) : (
            filteredTasks.map(t => {
              const cat = CATEGORIES.find(c => c.key === t.category);
              const isDone = t.status === 'done';
              return (
                <div key={t.id} className={`task-item-card ${isDone ? 'completed' : ''}`}>
                  <div onClick={() => handleToggleTask(t.id)} className="task-checkbox-custom">
                    {isDone && '✓'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`rank-badge rank-${t.rank}`} style={{ fontSize: '11px', padding: '2px 6px' }}>{t.rank}-RANK</span>
                      <span className="task-title">{t.title}</span>
                    </div>
                    {t.description && <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{t.description}</div>}
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {cat && <span style={{ color: cat.color }}>{cat.label}</span>}
                      <span>📅 {t.dueDate || 'Без даты'}</span>
                    </div>
                  </div>
                  <div className="rewards-pill">
                    <span className="xp-gain">+{t.xpReward} XP</span>
                    <span className="gold-gain">+{t.coinReward} 🪙</span>
                  </div>
                  <button onClick={() => deleteTask(t.id)} className="btn-system btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>🗑️</button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* KANBAN VIEW */}
      {currentView === 'kanban' && (
        <div className="kanban-board-grid" style={{ marginTop: '16px' }}>
          {['todo', 'in_progress', 'done'].map((statusKey) => (
            <div key={statusKey} className="kanban-column">
              <div className="kanban-column-header">
                <span>{statusKey === 'todo' ? '📝 К ИСПОЛНЕНИЮ' : statusKey === 'in_progress' ? '⚡ В ПРОЦЕССЕ' : '✅ ВЫПОЛНЕНО'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTasks.filter(t => t.status === statusKey).map(t => (
                  <div key={t.id} className={`task-item-card ${t.status === 'done' ? 'completed' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <span className={`rank-badge rank-${t.rank}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{t.rank}-RANK</span>
                      <div className="rewards-pill" style={{ fontSize: '10px', padding: '2px 6px' }}>
                        <span className="xp-gain">+{t.xpReward} XP</span>
                        <span className="gold-gain">+{t.coinReward} 🪙</span>
                      </div>
                    </div>
                    <div className="task-title" style={{ marginTop: '6px' }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', width: '100%', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleToggleTask(t.id)} className="btn-system" style={{ padding: '4px 8px', fontSize: '11px' }}>
                        {t.status === 'done' ? '↩️ Отменить' : '✓ Завершить'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {currentView === 'calendar' && (
        <div className="calendar-view-container" style={{ marginTop: '16px', background: 'var(--bg-card)', border: 'var(--border-system)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
          <h3 className="font-system text-glow" style={{ marginBottom: '16px' }}>КАЛЕНДАРЬ КВЕСТОВ</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--font-system)', fontSize: '12px', color: 'var(--system-blue)', padding: '6px' }}>{d}</div>
            ))}
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const dateStr = `2026-07-${String(day).padStart(2, '0')}`;
              const dayTasks = tasks.filter(t => t.dueDate === dateStr);
              return (
                <div key={day} style={{ background: 'rgba(5,12,28,0.7)', border: '1px solid rgba(0,240,255,0.1)', minHeight: '70px', borderRadius: '6px', padding: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-system)', fontSize: '11px', color: 'var(--text-muted)' }}>{day}</div>
                  {dayTasks.map(dt => (
                    <div key={dt.id} style={{ fontSize: '10px', padding: '2px 4px', background: 'rgba(0,240,255,0.15)', borderRadius: '3px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '18px' }}>➕ ПРИНЯТЬ НОВЫЙ КВЕСТ / ЗАДАЧУ</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-system)' }}>НАЗВАНИЕ КВЕСТА</label>
                <input type="text" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} class="input-system" placeholder="Например: Закончить модуль..." required style={{ marginTop: '4px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-system)' }}>ОПИСАНИЕ</label>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} class="textarea-system" rows="3" placeholder="Подробное описание..." style={{ marginTop: '4px' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-system)' }}>КАТЕГОРИЯ</label>
                  <select value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })} className="select-system" style={{ marginTop: '4px' }}>
                    {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-system)' }}>РАНГ ПРИОРИТЕТА</label>
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

              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-system)' }}>СРОК ВЫПОЛНЕНИЯ</label>
                <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="input-system" style={{ marginTop: '4px' }} />
              </div>

              <button type="submit" className="btn-system" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                ⚡ ДОБАВИТЬ В ЖУРНАЛ КВЕСТОВ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
