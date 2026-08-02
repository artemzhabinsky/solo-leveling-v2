import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { getRankTitle } from '../../domain/ranks.js';
import { xpRequiredForLevel } from '../../domain/xp.js';

export function Header({ onOpenBackup }) {
  const { name, level, xp, gold, activeTitle, hasShield } = usePlayerStore();
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="player-name">{name}</span>
                {activeTitle && (
                  <span style={{ fontSize: '11px', color: 'var(--system-gold)', background: 'rgba(255, 215, 0, 0.15)', border: '1px solid rgba(255, 215, 0, 0.4)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    «{activeTitle}»
                  </span>
                )}
                {hasShield && (
                  <span style={{ fontSize: '11px', color: 'var(--system-blue)', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid var(--system-blue)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                    🛡️ ЩИТ
                  </span>
                )}
              </div>
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

          {/* Gold Balance & Backup Toggle */}
          <div className="stats-summary">
            <div className="currency-badge">
              <span>🪙</span>
              <span>{gold.toLocaleString()}</span>
            </div>

            {onOpenBackup && (
              <button
                onClick={onOpenBackup}
                className="btn-system btn-gold"
                style={{ padding: '6px 12px', fontSize: '11px' }}
                title="Бэкап и сохранение"
              >
                💾 БЭКАП
              </button>
            )}

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
