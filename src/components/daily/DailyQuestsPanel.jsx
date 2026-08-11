import React, { useState, useEffect } from 'react';
import { useDailyQuestStore } from '../../store/useDailyQuestStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { sfx } from '../../services/audioService.js';
import { getLocalDateStr } from '../../utils/dateUtils.js';

export function DailyQuestsPanel({ onShowLevelUp }) {
  const { quests, toggleQuestCompleted, addQuest, deleteQuest } = useDailyQuestStore();
  const { dailyStreak, awardXpAndGold, checkMissedDailyQuests } = usePlayerStore();
  
  const [newTitle, setNewTitle] = useState('');
  const [newXp, setNewXp] = useState(100);
  const [newCoins, setNewCoins] = useState(20);
  const [, setTick] = useState(0);

  const todayStr = getLocalDateStr();

  // Auto-check for missed daily quests & 1-second interval for countdown timer
  useEffect(() => {
    if (checkMissedDailyQuests) {
      checkMissedDailyQuests(quests);
    }
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const diffMs = midnight.getTime() - now.getTime();
    if (diffMs <= 0) return '00ч 00мин 00сек';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}ч ${pad(mins)}мин ${pad(secs)}сек`;
  };

  const handleToggle = (questId) => {
    const result = toggleQuestCompleted(questId);
    if (result) {
      if (result.justCompleted) {
        sfx.playQuestComplete();
        const rewardResult = awardXpAndGold(result.quest.xp, result.quest.coins, 'spirit');
        if (rewardResult.leveledUp) {
          onShowLevelUp(rewardResult);
        }
      } else {
        revertXpAndGold(result.quest.xp, result.quest.coins, 'spirit');
      }
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addQuest(newTitle.trim(), newXp, newCoins);
    setNewTitle('');
    setNewXp(100);
    setNewCoins(20);
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

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="input-system"
          placeholder="Название нового квеста..."
          style={{ flexGrow: 1, minWidth: '220px' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--system-blue)', fontWeight: 600 }}>XP:</label>
          <input
            type="number"
            value={newXp}
            onChange={(e) => setNewXp(e.target.value)}
            className="input-system"
            style={{ width: '80px', padding: '10px' }}
            min="1"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontWeight: 600 }}>🪙 Монеты:</label>
          <input
            type="number"
            value={newCoins}
            onChange={(e) => setNewCoins(e.target.value)}
            className="input-system"
            style={{ width: '80px', padding: '10px' }}
            min="0"
          />
        </div>

        <button type="submit" className="btn-system" style={{ whiteSpace: 'nowrap' }}>+ ДОБАВИТЬ</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        {quests.map(q => {
          const isDoneToday = q.lastCompletedDate === todayStr;
          return (
            <div key={q.id} className={`task-item-card ${isDoneToday ? 'completed' : ''}`} style={{ borderColor: 'rgba(138, 43, 226, 0.3)', flexWrap: 'wrap' }}>
              <div onClick={() => handleToggle(q.id)} className="task-checkbox-custom" style={{ borderColor: 'var(--system-purple)' }}>
                {isDoneToday && '✓'}
              </div>
              <div style={{ flexGrow: 1, minWidth: '220px' }}>
                <div className="task-title" style={{ fontSize: '15px', fontWeight: 600 }}>{q.title}</div>
                {isDoneToday && (
                  <div style={{ fontSize: '12px', color: 'var(--system-blue)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⏳ Сброс квеста через:</span>
                    <span style={{ color: 'var(--system-gold)' }}>{getTimeUntilMidnight()} (в 00:00)</span>
                  </div>
                )}
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
