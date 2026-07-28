import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { getRankTitle } from '../../domain/ranks.js';
import { sfx } from '../../services/audioService.js';

export function LevelUpModal({ data, onClose }) {
  useEffect(() => {
    if (data) {
      sfx.playLevelUp();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [data]);

  if (!data) return null;

  const rankInfo = getRankTitle(data.newLevel);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: 'center', borderColor: 'var(--system-blue)', boxShadow: '0 0 50px var(--system-blue)' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚔️</div>
        <h1 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '28px', letterSpacing: '3px' }}>СИСТЕМА: LEVEL UP!</h1>
        <div className="font-system" style={{ fontSize: '22px', color: '#ffffff', marginTop: '10px', fontWeight: '900' }}>
          УРОВЕНЬ {data.newLevel} — {rankInfo.title}
        </div>
        <div style={{ color: 'var(--system-gold)', fontFamily: 'var(--font-system)', marginTop: '8px', fontSize: '16px' }}>
          +{data.statPointsGained} Очков Характеристик
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '14px', lineHeight: '1.5' }}>
          Вы стали сильнее! Откройте Окно Статуса, чтобы распределить очки характеристик.
        </p>
        <button onClick={onClose} className="btn-system" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}>
          ПРИНЯТЬ
        </button>
      </div>
    </div>
  );
}
