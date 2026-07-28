import React from 'react';

export function TodayCompletedModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYmdnaG1lZWFmYWF1bDg1anFrZWpweDVlNDJnNzg0M2w1NWc4ZWFrOSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/eZBKMO3eWmIi4/giphy.gif";

  return (
    <div className="modal-overlay" style={{ zIndex: 10005 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          textAlign: 'center',
          border: '2px solid var(--system-gold)',
          boxShadow: '0 0 45px rgba(255, 215, 0, 0.4)',
          background: 'linear-gradient(180deg, rgba(12, 24, 52, 0.98), rgba(5, 10, 22, 0.98))',
          padding: '32px 24px'
        }}
      >
        <div
          style={{
            width: '100%',
            maxHeight: '260px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '20px',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
          }}
        >
          <img
            src={gifUrl}
            alt="Victory Celebration"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>

        <h2 className="font-orbitron text-gold-glow" style={{ fontSize: '24px', color: 'var(--system-gold)', marginBottom: '8px' }}>
          🎉 ПОЗДРАВЛЯЕМ! 🎉
        </h2>

        <p className="font-system text-glow" style={{ fontSize: '16px', color: 'var(--system-blue)', lineHeight: '1.5', marginBottom: '24px', fontWeight: 600 }}>
          Все задачи на сегодня успешно выполнены!<br />
          Вы славно потрудились, можете идти отдыхать! 👑
        </p>

        <button
          onClick={onClose}
          className="btn-system btn-gold"
          style={{ width: '100%', justifyContent: 'center', fontSize: '15px', padding: '12px 24px' }}
        >
          ОТДОХНУТЬ С ЧЕСТЬЮ
        </button>
      </div>
    </div>
  );
}
