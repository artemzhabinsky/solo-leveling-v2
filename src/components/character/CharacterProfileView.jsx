import React, { useState } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import GoblinAvatar from '../avatar/GoblinAvatar.jsx';
import { STAGES, getStageForLevel } from '../../domain/goblinStages.js';

import Stage1 from '../avatar/stages/Stage1.jsx';
import Stage2 from '../avatar/stages/Stage2.jsx';
import Stage3 from '../avatar/stages/Stage3.jsx';
import Stage4 from '../avatar/stages/Stage4.jsx';
import Stage5 from '../avatar/stages/Stage5.jsx';
import Stage6 from '../avatar/stages/Stage6.jsx';
import Stage7 from '../avatar/stages/Stage7.jsx';

const STAGE_SVGS = { 1: Stage1, 2: Stage2, 3: Stage3, 4: Stage4, 5: Stage5, 6: Stage6, 7: Stage7 };

export function CharacterProfileView({ onOpenStatus }) {
  const { name, level, stats, hp, statPoints, setName } = usePlayerStore();
  const [editName, setEditName] = useState(name);

  const currentStageNum = getStageForLevel(level);
  const currentStageInfo = STAGES.find(s => s.stage === currentStageNum) || STAGES[0];

  const hearts = Array.from({ length: 3 }, (_, i) => i < hp);

  const handleSaveName = () => {
    if (editName.trim()) {
      setName(editName.trim());
    }
  };

  return (
    <div className="character-chamber-compact">
      {/* Compact Hero Card with SVG Goblin Avatar */}
      <div className="avatar-hero-card-compact">
        <div className="avatar-compact-badge" style={{ width: '130px', height: '130px', color: 'var(--system-blue)' }}>
          <GoblinAvatar level={level} />
        </div>
        <h2 className="avatar-tier-title-compact">{currentStageInfo.title}</h2>
        <div className="avatar-race-tag">{currentStageInfo.race}</div>

        {/* HP Hearts Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', background: 'rgba(255, 42, 95, 0.1)', border: '1px solid rgba(255, 42, 95, 0.3)', padding: '6px 14px', borderRadius: '20px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-system)', color: 'var(--system-crimson)', fontWeight: 'bold' }}>ЗДОРОВЬЕ HP:</span>
          <div style={{ display: 'flex', gap: '4px', fontSize: '16px' }}>
            {hearts.map((full, idx) => (
              <span key={idx} style={{ opacity: full ? 1 : 0.2, filter: full ? 'drop-shadow(0 0 6px #ff2a5f)' : 'none' }}>
                ❤️
              </span>
            ))}
          </div>
        </div>

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

        {/* Open Status Allocation Modal Button */}
        <button
          onClick={onOpenStatus}
          className={`btn-system ${statPoints > 0 ? 'btn-gold' : ''}`}
          style={{ marginTop: '16px', width: '100%', justifyContent: 'center' }}
        >
          📊 ОКНО СТАТУСА {statPoints > 0 && `(+${statPoints})`}
        </button>
      </div>

      {/* Evolution Tree Grid */}
      <div className="daily-quest-panel">
        <div className="daily-quest-header">
          <div>
            <div className="daily-quest-title" style={{ color: 'var(--system-blue)', fontSize: '16px' }}>🧬 ДЕРЕВО ЭВОЛЮЦИИ ГОБЛИНА (7 СТАДИЙ)</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Прогресс мутации от нищего гоблина до Гигачад Монарха 30-го уровня.
            </div>
          </div>
        </div>

        <div className="evolution-tree-compact-container">
          {STAGES.map(st => {
            const isCurrent = st.stage === currentStageNum;
            const isUnlocked = level >= st.minLevel;
            const StageSvgComp = STAGE_SVGS[st.stage];

            return (
              <div key={st.stage} className={`evolution-stage-row-compact ${isCurrent ? 'active' : (isUnlocked ? '' : 'locked')}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="stage-badge-icon" style={{ width: '48px', height: '48px', color: isUnlocked ? 'var(--system-blue)' : '#666' }}>
                    {StageSvgComp && <StageSvgComp />}
                  </div>
                  <div>
                    <div className="stage-title">{isUnlocked ? st.title : '🔒 Заблокированная форма'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{st.race}</div>
                  </div>
                </div>
                <div className="stage-req" style={{ textAlign: 'right', fontSize: '11px' }}>
                  {isCurrent ? '⭐ ТЕКУЩАЯ ФОРМА' : (isUnlocked ? '✓ РАЗБЛОКИРОВАНО' : `🔒 ТРЕБУЕТСЯ ${st.minLevel} УРОВЕНЬ`)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
