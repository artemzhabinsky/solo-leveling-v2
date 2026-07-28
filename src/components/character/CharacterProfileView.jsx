import React, { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { SystemState } from '../../domain/evolution.js';

export function CharacterProfileView() {
  const { name, level, stats, setName } = usePlayerStore();
  const [editName, setEditName] = useState(name);
  const evoInfo = SystemState.getAvatarEvolution(level);

  const handleSaveName = () => {
    if (editName.trim()) {
      setName(editName.trim());
    }
  };

  return (
    <div className="character-chamber-compact">
      {/* Compact Hero Card */}
      <div className="avatar-hero-card-compact">
        <div className="avatar-compact-badge">
          <span>{evoInfo.currentTier.icon}</span>
        </div>
        <h2 className="avatar-tier-title-compact">{evoInfo.currentTier.name}</h2>
        <div className="avatar-race-tag">{evoInfo.currentTier.race}</div>

        {/* Rename Input */}
        <div style={{ marginTop: '14px', width: '100%' }}>
          <label style={{ fontSize: '11px', color: 'var(--system-blue)', fontFamily: 'var(--font-system)' }}>ИМЯ ИГРОКА</label>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="input-system" style={{ padding: '8px 12px', fontSize: '13px' }} />
            <button onClick={handleSaveName} className="btn-system" style={{ padding: '6px 12px', fontSize: '12px' }}>💾</button>
          </div>
        </div>

        {/* Compact Stats Summary */}
        <div className="char-stats-summary-grid">
          <div className="char-stat-item"><span className="lbl">STR (Сила)</span><strong>{stats.strength}</strong></div>
          <div className="char-stat-item"><span className="lbl">INT (Интеллект)</span><strong>{stats.intelligence}</strong></div>
          <div className="char-stat-item"><span className="lbl">VIT (Выносливость)</span><strong>{stats.vitality}</strong></div>
          <div className="char-stat-item"><span className="lbl">SEN (Восприятие)</span><strong>{stats.sense}</strong></div>
        </div>

        <p className="avatar-description-compact">
          {evoInfo.currentTier.description}
        </p>
      </div>

      {/* Evolution Tree Grid */}
      <div className="daily-quest-panel">
        <div className="daily-quest-header">
          <div>
            <div className="daily-quest-title" style={{ color: 'var(--system-blue)', fontSize: '16px' }}>🧬 ДЕРЕВО ЭВОЛЮЦИИ ПЕРСОНАЖА</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Прогресс мутации от слабого гоблина до Ультимативного Гигачада Монарха.
            </div>
          </div>
        </div>

        <div className="evolution-tree-compact-container">
          {evoInfo.allTiers.map(tier => {
            const isCurrent = tier.tier === evoInfo.currentTier.tier;
            const isUnlocked = level >= tier.minLevel;
            return (
              <div key={tier.tier} className={`evolution-stage-row-compact ${isCurrent ? 'active' : (isUnlocked ? '' : 'locked')}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="stage-badge-icon">{tier.icon}</div>
                  <div>
                    <div className="stage-title">{isUnlocked ? tier.name : '🔒 Заблокированная форма'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tier.race}</div>
                  </div>
                </div>
                <div className="stage-req" style={{ textAlign: 'right', fontSize: '11px' }}>
                  {isCurrent ? '⭐ ТЕКУЩАЯ ФОРМА' : (isUnlocked ? '✓ РАЗБЛОКИРОВАНО' : `🔒 ТРЕБУЕТСЯ ${tier.minLevel} УРОВЕНЬ`)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
