import React from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { getRankTitle } from '../../domain/ranks.js';
import { xpRequiredForLevel } from '../../domain/xp.js';

export function Header({ onOpenStatus }) {
  const { name, level, xp, gold, hp, statPoints } = usePlayerStore();
  const rankInfo = getRankTitle(level);
  const reqXp = xpRequiredForLevel(level);
  const xpPercent = Math.min(100, Math.round((xp / reqXp) * 100));

  // Render HP Hearts
  const hearts = Array.from({ length: 3 }, (_, i) => i < hp);

  return (
    <header class="system-header">
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

      {/* HP Hearts, Gold & Status Button */}
      <div className="stats-summary">
        {/* HP Hearts */}
        <div className="hp-hearts" title={`Здоровье HP: ${hp}/3`}>
          {hearts.map((full, idx) => (
            <span key={idx} style={{ opacity: full ? 1 : 0.25, filter: full ? 'drop-shadow(0 0 5px #ff2a5f)' : 'none' }}>
              ❤️
            </span>
          ))}
        </div>

        {/* Gold */}
        <div className="currency-badge">
          <span>🪙</span>
          <span>{gold.toLocaleString()}</span>
        </div>

        {/* Status Button */}
        <button
          onClick={onOpenStatus}
          className={`btn-system stat-points-indicator ${statPoints > 0 ? 'has-points' : ''}`}
        >
          📊 СТАТУС {statPoints > 0 && `(+${statPoints})`}
        </button>
      </div>
    </header>
  );
}
