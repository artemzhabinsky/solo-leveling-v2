import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { getRankTitle } from '../../domain/ranks.js';
import { xpRequiredForLevel } from '../../domain/xp.js';

export function Header() {
  const { name, level, xp, gold } = usePlayerStore();
  const rankInfo = getRankTitle(level);
  const reqXp = xpRequiredForLevel(level);
  const xpPercent = Math.min(100, Math.round((xp / reqXp) * 100));

  return (
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

      {/* Gold Balance Only */}
      <div className="stats-summary">
        <div className="currency-badge">
          <span>🪙</span>
          <span>{gold.toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
