import React, { useState } from 'react';
import { useDailyQuestStore } from '../../store/useDailyQuestStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { sfx } from '../../services/audioService.js';

export function DailyQuestsPanel({ onShowLevelUp }) {
  const { quests, toggleQuestCompleted, addQuest, deleteQuest } = useDailyQuestStore();
  const { dailyStreak, awardXpAndGold } = usePlayerStore();
  const [newTitle, setNewTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleToggle = (questId) => {
    const result = toggleQuestCompleted(questId);
    if (result && result.justCompleted) {
      sfx.playQuestComplete();
      const rewardResult = awardXpAndGold(result.quest.xp, result.quest.coins, 'spirit');
      if (rewardResult.leveledUp) {
        onShowLevelUp(rewardResult);
      }
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addQuest(newTitle.trim());
    setNewTitle('');
  };

  return (
    <div className="daily-quest-panel">
      <div className="daily-quest-header">
        <div>
          <div className="daily-quest-title" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--system-blue)' }}>
            ЕЖЕДНЕВНЫЙ КВЕСТ: ПОДГОТОВКА СТАТЬ СИЛЬНЕЕ
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.5' }}>
            Выполняйте комплекс упражнений для поддержания формы. Пропуск дня снижает здоровье HP!
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 42, 95, 0.15)', border: '1px solid var(--system-crimson)', color: 'var(--system-crimson)', padding: '6px 14px', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: '700', marginTop: '12px' }}>
            СЕРИЯ: {dailyStreak} ДНЕЙ
          </div>
        </div>
      </div>

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="input-system" placeholder="Добавить свой ежедневный квест..." />
        <button type="submit" className="btn-system" style={{ whiteSpace: 'nowrap' }}>+ ДОБАВИТЬ</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        {quests.map(q => {
          const isDoneToday = q.lastCompletedDate === todayStr;
          return (
            <div key={q.id} className={`task-item-card ${isDoneToday ? 'completed' : ''}`} style={{ borderColor: 'rgba(138, 43, 226, 0.3)' }}>
              <div onClick={() => handleToggle(q.id)} className="task-checkbox-custom" style={{ borderColor: 'var(--system-purple)' }}>
                {isDoneToday && '✓'}
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="task-title" style={{ fontSize: '15px', fontWeight: 600 }}>{q.title}</div>
              </div>
              <div className="rewards-pill">
                <span className="xp-gain">+{q.xp} XP</span>
                <span className="gold-gain">+{q.coins} 🪙</span>
              </div>
              <button onClick={() => deleteQuest(q.id)} className="btn-system btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>🗑️</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
