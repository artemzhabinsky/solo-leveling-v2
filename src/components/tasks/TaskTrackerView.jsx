import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../store/useTaskStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { CATEGORIES } from '../../domain/categories.js';
import { sfx } from '../../services/audioService.js';
import { TodayCompletedModal } from '../modals/TodayCompletedModal.jsx';
import { getLocalDateStr } from '../../utils/dateUtils.js';

export function TaskTrackerView({ onShowLevelUp }) {
  const {
    tasks,
    currentView,
    filterCategory,
    filterRank,
    setView,
    setFilterCategory,
    setFilterRank,
    addTask,
    editTask,
    toggleSubtask,
    updateTaskStatus,
    deleteTask,
    rolloverOverdueTasks
  } = useTaskStore();
  const { awardXpAndGold, revertXpAndGold } = usePlayerStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isTodayCompletedModalOpen, setIsTodayCompletedModalOpen] = useState(false);

  // Expanded Subtasks State map: { [taskId]: boolean }
  const [expandedTasksMap, setExpandedTasksMap] = useState({});

  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [cardInlineSubtaskInput, setCardInlineSubtaskInput] = useState({});

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'mental',
    rank: 'C',
    status: 'urgent',
    dueDate: getLocalDateStr(),
    subtasks: []
  });

  // Auto-rollover overdue tasks to today's date when TaskTrackerView mounts
  useEffect(() => {
    if (rolloverOverdueTasks) {
      rolloverOverdueTasks();
    }
  }, []);

  const toggleTaskExpanded = (taskId) => {
    setExpandedTasksMap(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleAddInlineSubtask = (task) => {
    const title = (cardInlineSubtaskInput[task.id] || '').trim();
    if (!title) return;

    const newSub = { id: 'sub-' + Date.now(), title, completed: false };
    const updatedSubtasks = [...(task.subtasks || []), newSub];
    editTask(task.id, { subtasks: updatedSubtasks });
    setCardInlineSubtaskInput(prev => ({ ...prev, [task.id]: '' }));
  };

  const handleRemoveInlineSubtask = (task, subId) => {
    const updatedSubtasks = (task.subtasks || []).filter(s => s.id !== subId);
    editTask(task.id, { subtasks: updatedSubtasks });
  };

  const filteredTasks = tasks.filter(t => {
    const matchCat = filterCategory === 'all' || t.category === filterCategory;
    const matchRank = filterRank === 'all' || t.rank === filterRank;
    return matchCat && matchRank;
  });

  const todayStr = getLocalDateStr();

  // Helper predicate: A task is completed on a past day if it is done and completedAt/dueDate < todayStr
  const isCompletedOnPastDay = (t) => {
    if (t.status !== 'done') return false;
    const compDate = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
    return compDate && compDate < todayStr;
  };

  // Active tasks for List, Kanban, and Calendar views (Excludes past completed tasks)
  const activeFilteredTasks = filteredTasks.filter(t => !isCompletedOnPastDay(t));

  // All completed tasks for the dedicated 'completed' tab archive
  const archiveCompletedTasks = filteredTasks.filter(t => t.status === 'done');

  const handleToggleTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'done' ? 'urgent' : 'done';
    const result = updateTaskStatus(taskId, newStatus);

    if (result) {
      if (result.justCompleted) {
        sfx.playQuestComplete();
        const rewardResult = awardXpAndGold(task.xpReward, task.coinReward, task.category);
        editTask(taskId, { lastEarnedXp: rewardResult.finalXp, lastEarnedGold: rewardResult.finalGold });
        if (rewardResult.leveledUp) {
          onShowLevelUp(rewardResult);
        }
        if (result.allTodayCompleted) {
          setIsTodayCompletedModalOpen(true);
        }
      } else {
        const earnedXp = task.lastEarnedXp || task.xpReward;
        const earnedGold = task.lastEarnedGold || task.coinReward;
        revertXpAndGold(earnedXp, earnedGold, task.category);
      }
    }
  };

  const handleAddTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    addTask(taskForm);
    setTaskForm({
      title: '',
      description: '',
      category: 'mental',
      rank: 'C',
      status: 'urgent',
      dueDate: getLocalDateStr(),
      subtasks: []
    });
    setIsAddModalOpen(false);
  };

  const handleEditTaskSubmit = (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    editTask(editingTask.id, editingTask);
    setEditingTask(null);
  };

  const handleAddSubtaskToForm = (isEdit = false) => {
    if (!newSubtaskInput.trim()) return;
    const subObj = { id: 'sub-' + Date.now(), title: newSubtaskInput.trim(), completed: false };

    if (isEdit) {
      setEditingTask({ ...editingTask, subtasks: [...(editingTask.subtasks || []), subObj] });
    } else {
      setTaskForm({ ...taskForm, subtasks: [...taskForm.subtasks, subObj] });
    }
    setNewSubtaskInput('');
  };

  const handleRemoveSubtaskFromForm = (subId, isEdit = false) => {
    if (isEdit) {
      setEditingTask({ ...editingTask, subtasks: editingTask.subtasks.filter(s => s.id !== subId) });
    } else {
      setTaskForm({ ...taskForm, subtasks: taskForm.subtasks.filter(s => s.id !== subId) });
    }
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

    const task = tasks.find(t => t.id === taskId);
    const wasDone = task && task.status === 'done';

    const result = updateTaskStatus(taskId, targetStatus);
    if (result) {
      if (result.justCompleted && task) {
        sfx.playQuestComplete();
        const rewardResult = awardXpAndGold(task.xpReward, task.coinReward, task.category);
        if (rewardResult.leveledUp) {
          onShowLevelUp(rewardResult);
        }
        if (result.allTodayCompleted) {
          setIsTodayCompletedModalOpen(true);
        }
      } else if (wasDone && targetStatus !== 'done' && task) {
        revertXpAndGold(task.xpReward, task.coinReward, task.category);
      }
    }
  };

  // Chronological Grouping Logic for List View (Сегодня, Завтра, На неделе, Потом)
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrowObj);

  const weekEndObj = new Date();
  weekEndObj.setDate(weekEndObj.getDate() + 7);
  const weekEndStr = getLocalDateStr(weekEndObj);

  const todayTasks = activeFilteredTasks.filter(t => !t.dueDate || t.dueDate <= todayStr);
  const tomorrowTasks = activeFilteredTasks.filter(t => t.dueDate === tomorrowStr);
  const weekTasks = activeFilteredTasks.filter(t => t.dueDate > tomorrowStr && t.dueDate <= weekEndStr);
  const laterTasks = activeFilteredTasks.filter(t => t.dueDate > weekEndStr);

  const todayPlannedCount = activeFilteredTasks.filter(t => (t.originalDueDate || t.dueDate) === todayStr).length;
  const todayActualDoneCount = todayTasks.filter(t => t.status === 'done').length;

  const renderYouGileSubtaskTree = (t) => {
    const subtasks = t.subtasks || [];
    const isExpanded = !!expandedTasksMap[t.id];
    const completedSubs = subtasks.filter(s => s.completed).length;
    const totalSubs = subtasks.length;
    const percent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0;

    return (
      <div style={{ marginTop: '10px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', cursor: 'pointer' }} onClick={() => toggleTaskExpanded(t.id)}>
          <div style={{ flexGrow: 1, height: '6px', background: 'rgba(5, 12, 30, 0.9)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, height: '100%', background: 'var(--system-blue)', transition: 'width 0.3s ease' }}></div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {completedSubs}/{totalSubs}
          </span>
          <button
            type="button"
            className="btn-sidebar-toggle"
            style={{ padding: '2px 6px', fontSize: '10px' }}
            title={isExpanded ? 'Скрыть подзадачи' : 'Раскрыть подзадачи'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>

        {isExpanded && (
          <div className="yougile-subtask-tree-container">
            {subtasks.map(s => (
              <div key={s.id} className="yougile-subtask-item-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexGrow: 1 }}>
                  <span
                    onClick={() => toggleSubtask(t.id, s.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: '2px solid var(--system-blue)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#000',
                      background: s.completed ? 'var(--system-blue)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {s.completed && '✓'}
                  </span>
                  <span style={{ fontSize: '13px', color: s.completed ? 'var(--text-dim)' : 'var(--text-main)', textDecoration: s.completed ? 'line-through' : 'none' }}>
                    {s.title}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveInlineSubtask(t, s.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--system-crimson)', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <input
                type="text"
                value={cardInlineSubtaskInput[t.id] || ''}
                onChange={(e) => setCardInlineSubtaskInput({ ...cardInlineSubtaskInput, [t.id]: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInlineSubtask(t); } }}
                className="input-system"
                placeholder="+ Создать подзадачу..."
                style={{ padding: '6px 10px', fontSize: '12px' }}
              />
              <button
                type="button"
                onClick={() => handleAddInlineSubtask(t)}
                className="btn-system"
                style={{ padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
              >
                + Добавить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTaskCard = (t) => {
    const cat = CATEGORIES.find(c => c.key === t.category);
    const isDone = t.status === 'done';
    return (
      <div key={t.id} className={`task-item-card ${isDone ? 'completed' : ''}`} style={{ flexWrap: 'wrap' }}>
        <div onClick={() => handleToggleTask(t.id)} className="task-checkbox-custom">
          {isDone && '✓'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`rank-badge rank-${t.rank}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{t.rank}-RANK</span>
            <span className="task-title" style={{ fontSize: '15px', fontWeight: 600 }}>{t.title}</span>
          </div>
          {t.description && <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>{t.description}</div>}
          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {cat && <span style={{ color: cat.color, fontWeight: 600 }}>{cat.label}</span>}
            <span>📅 {t.dueDate || 'Без даты'}</span>
            {t.completedAt && <span style={{ color: '#00ff88' }}>✓ Выполнено: {new Date(t.completedAt).toLocaleDateString('ru-RU')}</span>}
          </div>
          
          {renderYouGileSubtaskTree(t)}
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

  const totalArchivedXp = archiveCompletedTasks.reduce((acc, t) => acc + (t.xpReward || 0), 0);
  const totalArchivedGold = archiveCompletedTasks.reduce((acc, t) => acc + (t.coinReward || 0), 0);

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
          <button onClick={() => setView('completed')} className={`view-btn ${currentView === 'completed' ? 'active' : ''}`}>✅ Done</button>
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
        </div>
      </div>

      {/* CHRONOLOGICAL GROUPED LIST VIEW */}
      {currentView === 'list' && (
        <div className="tasks-list-container" style={{ marginTop: '20px' }}>
          {activeFilteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>Активных задач не найдено. Нажмите "+ Новая Задача"!</div>
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

      {/* KANBAN VIEW WITH YOUGILE SUBTASK TREES */}
      {currentView === 'kanban' && (
        <div className="kanban-board-grid" style={{ marginTop: '16px' }}>
          {[
            { key: 'urgent', title: '🔥 СРОЧНЫЕ' },
            { key: 'non_urgent', title: '⏳ НЕ СРОЧНЫЕ' },
            { key: 'done', title: '✅ ВЫПОЛНЕНО СЕГОДНЯ' }
          ].map((col) => (
            <div
              key={col.key}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
            >
              <div className="kanban-column-header">
                <span>{col.title} ({activeFilteredTasks.filter(t => (t.status || 'urgent') === col.key).length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeFilteredTasks.filter(t => (t.status || 'urgent') === col.key).map(t => {
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
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginTop: '6px' }}>
                        {cat && <span style={{ fontSize: '11px', color: cat.color, fontWeight: 600 }}>{cat.label}</span>}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📅 {t.dueDate || 'Без даты'}</span>
                      </div>

                      {renderYouGileSubtaskTree(t)}

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
              const dateStr = `2026-08-${String(day).padStart(2, '0')}`;
              const dayTasks = activeFilteredTasks.filter(t => t.dueDate === dateStr);
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

      {/* DEDICATED COMPLETED ARCHIVE VIEW */}
      {currentView === 'completed' && (
        <div style={{ marginTop: '20px' }}>
          <div className="task-section-card-container" style={{ borderColor: 'rgba(0, 255, 136, 0.4)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#00ff88', fontWeight: 700, letterSpacing: '1px' }}>🏆 АРХИВ ВЫПОЛНЕННЫХ КВЕСТОВ</div>
                <h2 className="font-orbitron" style={{ color: '#ffffff', fontSize: '20px', marginTop: '2px' }}>
                  ЗАВЕРШЁННЫЕ ЗАДАЧИ ({archiveCompletedTasks.length})
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '14px', fontSize: '13px' }}>
                <span className="xp-gain" style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  Всего получено: <strong>+{totalArchivedXp} XP</strong>
                </span>
                <span className="gold-gain" style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
                  Заработано: <strong>+{totalArchivedGold} 🪙</strong>
                </span>
              </div>
            </div>
          </div>

          {archiveCompletedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '50px', background: 'var(--bg-card)', border: 'var(--border-system)', borderRadius: '12px' }}>
              Выполненных задач пока нет. Выполните квест в списке или Канбане!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[...archiveCompletedTasks]
                .sort((a, b) => new Date(b.completedAt || b.dueDate).getTime() - new Date(a.completedAt || a.dueDate).getTime())
                .map(t => renderTaskCard(t))}
            </div>
          )}
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
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} className="textarea-system" rows="2" placeholder="Подробное описание..." style={{ marginTop: '4px' }}></textarea>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>ПОДЗАДАЧИ (ЧЕК-ЛИСТ)</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input type="text" value={newSubtaskInput} onChange={(e) => setNewSubtaskInput(e.target.value)} className="input-system" placeholder="Добавить пункт подзадачи..." />
                  <button type="button" onClick={() => handleAddSubtaskToForm(false)} className="btn-system" style={{ fontSize: '12px', padding: '6px 12px' }}>+ Подзадача</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  {taskForm.subtasks.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,12,28,0.7)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                      <span>• {s.title}</span>
                      <button type="button" onClick={() => handleRemoveSubtaskFromForm(s.id, false)} style={{ background: 'none', border: 'none', color: 'var(--system-crimson)', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
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
                    <option value="C">C-Rank (500 XP, 100 🪙)</option>
                    <option value="E">E-Rank (100 XP, 20 🪙)</option>
                    <option value="D">D-Rank (200 XP, 40 🪙)</option>
                    <option value="B">B-Rank (1000 XP, 200 🪙)</option>
                    <option value="A">A-Rank (1500 XP, 300 🪙)</option>
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
                <textarea value={editingTask.description || ''} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} className="textarea-system" rows="2" style={{ marginTop: '4px' }}></textarea>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>ПОДЗАДАЧИ (ЧЕК-ЛИСТ)</label>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <input type="text" value={newSubtaskInput} onChange={(e) => setNewSubtaskInput(e.target.value)} className="input-system" placeholder="Добавить пункт подзадачи..." />
                  <button type="button" onClick={() => handleAddSubtaskToForm(true)} className="btn-system" style={{ fontSize: '12px', padding: '6px 12px' }}>+ Подзадача</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                  {(editingTask.subtasks || []).map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(5,12,28,0.7)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                      <span>• {s.title}</span>
                      <button type="button" onClick={() => handleRemoveSubtaskFromForm(s.id, true)} style={{ background: 'none', border: 'none', color: 'var(--system-crimson)', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
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
                    <option value="C">C-Rank (500 XP, 100 🪙)</option>
                    <option value="E">E-Rank (100 XP, 20 🪙)</option>
                    <option value="D">D-Rank (200 XP, 40 🪙)</option>
                    <option value="B">B-Rank (1000 XP, 200 🪙)</option>
                    <option value="A">A-Rank (1500 XP, 300 🪙)</option>
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
