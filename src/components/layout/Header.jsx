import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { getRankTitle } from '../../domain/ranks.js';
import { xpRequiredForLevel } from '../../domain/xp.js';

export function Header() {
  const { name, level, xp, gold } = usePlayerStore();
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const rankInfo = getRankTitle(level);
  const reqXp = xpRequiredForLevel(level);
  const xpPercent = Math.min(100, Math.round((xp / reqXp) * 100));

  return (
    <div style={{ position: 'relative' }}>
      {!isHeaderHidden && (
        <header className="system-header">
          <div className="player-identity">
            <div className={`rank-badge rank-${rankInfo.rankCode}`}>
              {rankInfo.rankCode}-RANK
            </div>
            <div className="player-info-meta">
              <div className="player-name">{name}</div>
              <div className="player-title">{rankInfo.title}</div>
            </div>
          </div>

          {/* Level & XP Bar */}
          <div className="level-xp-container">
            <div className="level-meta">
              <span>УРОВЕНЬ: <span className="level-number">{level}</span></span>
              <span style={{ color: 'var(--text-muted)' }}>{xp} / {reqXp} XP ({xpPercent}%)</span>
            </div>
            <div className="xp-bar-bg">
              <div className="xp-bar-fill" style={{ width: `${xpPercent}%` }}></div>
            </div>
          </div>

          {/* Gold Balance & Hide Toggle */}
          <div className="stats-summary">
            <div className="currency-badge">
              <span>🪙</span>
              <span>{gold.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setIsHeaderHidden(true)}
              className="btn-sidebar-toggle"
              title="Скрыть шапку"
              style={{ padding: '8px' }}
            >
              <ChevronUp size={18} />
            </button>
          </div>
        </header>
      )}

      {isHeaderHidden && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
          <button
            onClick={() => setIsHeaderHidden(false)}
            className="btn-system"
            style={{ padding: '4px 12px', fontSize: '11px', gap: '4px' }}
          >
            <span>Показать шапку</span> <ChevronDown size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
