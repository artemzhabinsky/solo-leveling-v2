import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { getRankTitle } from '../../domain/ranks.js';
import { sfx } from '../../services/audioService.js';

export function StatusModal({ isOpen, onClose }) {
  const { level, statPoints, stats, allocateStat } = usePlayerStore();
  const rankInfo = getRankTitle(level);

  if (!isOpen) return null;

  const handleAllocate = (statKey) => {
    if (allocateStat(statKey)) {
      sfx.playStatClick();
    }
  };

  const statList = [
    { key: 'strength', name: 'СИЛА (STR)', desc: `+${stats.strength * 2}% к заработку Золота` },
    { key: 'intelligence', name: 'ИНТЕЛЛЕКТ (INT)', desc: `+${stats.intelligence * 2}% Множитель Опыта (XP)` },
    { key: 'vitality', name: 'ВЫНОСЛИВОСТЬ (VIT)', desc: `Защита серий квестов` },
    { key: 'goldBonus', name: 'ФИНАНСЫ (GOLD)', desc: `+${stats.goldBonus * 2}% Бонусные награды` },
    { key: 'sense', name: 'ВОСПРИЯТИЕ (SEN)', desc: `${(stats.sense * 1.5).toFixed(1)}% Шанс Критического удвоения` }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h2 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '20px' }}>📊 ОКНО СТАТУСА ПЕРСОНАЖА</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '16px', background: 'rgba(0,240,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,240,255,0.2)' }}>
          <div style={{ fontFamily: 'var(--font-system)', color: 'var(--system-blue)' }}>ЗВАНИЕ: <span style={{ color: 'var(--system-gold)' }}>{rankInfo.rankCode}</span> — {rankInfo.title}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Свободных очков характеристик: <strong style={{ color: 'var(--system-gold)', fontSize: '16px' }}>{statPoints}</strong>
          </div>
        </div>

        <div className="status-window">
          {statList.map((st) => (
            <div key={st.key} className="status-attribute-card">
              <div className="stat-name-box">
                <span className="stat-name">{st.name}</span>
                <span className="stat-desc">{st.desc}</span>
              </div>
              <div className="stat-value-box">
                <span className="stat-value">{stats[st.key]}</span>
                {statPoints > 0 && (
                  <button onClick={() => handleAllocate(st.key)} className="btn-add-stat">+</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
