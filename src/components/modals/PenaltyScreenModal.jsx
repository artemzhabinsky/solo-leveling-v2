import React, { useEffect } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { sfx } from '../../services/audioService.js';

export function PenaltyScreenModal() {
  const { showDeathModal, dismissDeathModal } = usePlayerStore();

  useEffect(() => {
    if (showDeathModal) {
      sfx.playDeathPenalty();
    }
  }, [showDeathModal]);

  if (!showDeathModal) return null;

  return (
    <div className="modal-overlay" style={{ background: 'rgba(255, 0, 40, 0.95)', zIndex: 99999 }}>
      <div className="modal-content" style={{ textAlign: 'center', borderColor: '#ff0040', boxShadow: '0 0 70px #ff0040', background: '#0a0005' }}>
        <div style={{ fontSize: '64px', animation: 'bounce 1s infinite' }}>💀</div>
        <h1 className="font-system" style={{ color: '#ff0040', fontSize: '32px', textShadow: '0 0 20px #ff0040', letterSpacing: '4px' }}>
          SYSTEM PENALTY: YOU DIED!
        </h1>
        <div style={{ color: '#ffffff', fontFamily: 'var(--font-system)', marginTop: '12px', fontSize: '18px' }}>
          СБРОС СИСТЕМЫ И ПЕРАМЕТРОВ ПЕРСОНАЖА
        </div>
        <p style={{ fontSize: '14px', color: '#ffb3c1', marginTop: '16px', lineHeight: '1.6' }}>
          Вы пропустили выполнение ежедневных квестов и потеряли все очки здоровья HP (0/3). Система применила штрафной сброс уровня, монет и характеристик!
          <br /><br />
          <em>Ваша история аналитики и событий сохранена в логах. Начните путь заново!</em>
        </p>
        <button onClick={dismissDeathModal} className="btn-system btn-danger" style={{ marginTop: '24px', width: '100%', justifyContent: 'center', fontSize: '16px', padding: '14px' }}>
          🔄 ВОЗРОДИТЬСЯ И НАЧАТЬ ЗАНОВО
        </button>
      </div>
    </div>
  );
}
