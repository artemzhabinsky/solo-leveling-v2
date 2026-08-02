import React from 'react';
import { sfx } from '../../services/audioService.js';

export function AchievementModal({ achievement, onClose, onEquipTitle }) {
  if (!achievement) return null;

  const handleEquip = () => {
    sfx.playLevelUp();
    onEquipTitle(achievement.rewardTitle);
    onClose();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10005 }}>
      <div className="modal-content" style={{ textAlign: 'center', maxWidth: '480px', borderColor: 'var(--system-gold)', background: 'linear-gradient(135deg, rgba(20, 15, 5, 0.95), rgba(5, 10, 25, 0.98))' }}>
        <div style={{ fontSize: '54px', animation: 'bounce 1s infinite alternate' }}>🏆</div>
        <div style={{ fontSize: '11px', color: 'var(--system-gold)', fontFamily: 'var(--font-orbitron)', letterSpacing: '2px', marginTop: '10px' }}>
          ◆ СИСТЕМНОЕ ДОСТИЖЕНИЕ ◆
        </div>
        <h2 className="font-orbitron text-gold-glow" style={{ fontSize: '22px', color: '#ffffff', marginTop: '6px' }}>
          {achievement.title}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>
          {achievement.description}
        </p>

        <div style={{ background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.4)', padding: '12px 18px', borderRadius: '12px', marginTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--system-gold)', fontWeight: 600 }}>ПОЛУЧЕН НОВЫЙ ТИТУЛ:</div>
          <div style={{ fontSize: '16px', color: '#ffffff', fontWeight: 800, marginTop: '4px' }}>
            «{achievement.rewardTitle}»
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' }}>
          <button onClick={handleEquip} className="btn-system btn-gold" style={{ flexGrow: 1, justifyContent: 'center' }}>
            🎖️ ЭКИПИРОВАТЬ ТИТУЛ
          </button>
          <button onClick={onClose} className="btn-system" style={{ justifyContent: 'center' }}>
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
}
