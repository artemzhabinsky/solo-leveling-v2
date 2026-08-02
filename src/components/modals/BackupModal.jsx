import React, { useState } from 'react';
import { exportBackupData, importBackupData } from '../../services/backupService.js';
import { sfx } from '../../services/audioService.js';

export function BackupModal({ isOpen, onClose }) {
  const [importStatus, setImportStatus] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupData();
    sfx.playBuy();
    alert('📥 Файл бэкапа успешно скачан! Сохраните его в надёжном месте.');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImportStatus('Восстановление данных...');
      await importBackupData(file);
      sfx.playLevelUp();
      alert('🎉 Все данные успешно восстановлены! Страница будет перезагружена.');
      window.location.reload();
    } catch (err) {
      setImportStatus('');
      alert('❌ Ошибка при восстановлении: ' + err.message);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10005 }}>
      <div className="modal-content" style={{ maxWidth: '520px', borderColor: 'var(--system-blue)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--system-blue)', fontFamily: 'var(--font-orbitron)', letterSpacing: '1px', fontWeight: 700 }}>
              ◆ СИСТЕМА БЕЗОПАСНОСТИ
            </div>
            <h2 className="font-orbitron text-glow" style={{ color: '#ffffff', fontSize: '18px', marginTop: '2px' }}>
              💾 БЭКАП И СИНХРОНИЗАЦИЯ
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-dim)', lineHeight: '1.6', marginBottom: '20px' }}>
          Создайте резервную копию всех ваших квестов, статистики, монет и наград в формате `.json`, чтобы гарантировать 100% сохранность при любых обновлениях или смене устройств.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* EXPORT BACKUP BUTTON */}
          <div style={{ background: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>📥 Скачать полный бэкап</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Сохранить квесты, статистику и монеты на компьютер</div>
            </div>
            <button onClick={handleExport} className="btn-system" style={{ whiteSpace: 'nowrap' }}>
              СКАЧАТЬ
            </button>
          </div>

          {/* IMPORT BACKUP BUTTON */}
          <div style={{ background: 'rgba(255, 215, 0, 0.08)', border: '1px solid rgba(255, 215, 0, 0.3)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>📤 Восстановить из файла</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>Загрузить ранее скачанный `.json` бэкап</div>
            </div>
            <label className="btn-system btn-gold" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
              ВЫБРАТЬ ФАЙЛ
              <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {importStatus && (
          <div style={{ textAlign: 'center', marginTop: '16px', color: 'var(--system-blue)', fontWeight: 700, fontSize: '13px' }}>
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
}
