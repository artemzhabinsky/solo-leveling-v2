import React, { useState } from 'react';
import { exportBackupData, importBackupData } from '../../services/backupService.js';
import { syncStateToCloud, fetchStateFromCloud } from '../../services/supabaseSync.js';
import { sfx } from '../../services/audioService.js';

export function BackupModal({ isOpen, onClose }) {
  const [importStatus, setImportStatus] = useState('');
  const [cloudStatus, setCloudStatus] = useState('');

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupData();
    sfx.playBuy();
    alert('📥 Файл бэкапа успешно скачан!');
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

  const handleCloudSync = async () => {
    setCloudStatus('Сохранение в Supabase...');
    const res = await syncStateToCloud();
    if (res.success) {
      sfx.playLevelUp();
      setCloudStatus('✅ Успешно сохранено в Supabase!');
    } else {
      setCloudStatus('❌ Ошибка Supabase: ' + res.error);
    }
  };

  const handleCloudLoad = async () => {
    setCloudStatus('Загрузка из Supabase...');
    const res = await fetchStateFromCloud();
    if (res.success) {
      sfx.playLevelUp();
      alert('☁️ Прогресс успешно загружен из Supabase! Перезагрузка...');
      window.location.reload();
    } else {
      setCloudStatus('❌ Ошибка загрузки: ' + res.error);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 10005 }}>
      <div className="modal-content" style={{ maxWidth: '560px', borderColor: 'var(--system-blue)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--system-blue)', fontFamily: 'var(--font-orbitron)', letterSpacing: '1px', fontWeight: 700 }}>
              ◆ СИСТЕМА БЕЗОПАСНОСТИ & SUPABASE
            </div>
            <h2 className="font-orbitron text-glow" style={{ color: '#ffffff', fontSize: '18px', marginTop: '2px' }}>
              💾 БЭКАП И ОБЛАКО SUPABASE
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        </div>

        {/* SUPABASE CLOUD SECTION */}
        <div style={{ background: 'rgba(0, 240, 255, 0.06)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--system-blue)', fontWeight: 700, letterSpacing: '1px' }}>
            ☁️ ОБЛАЧНАЯ СИНХРОНИЗАЦИЯ SUPABASE
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px', marginBottom: '12px' }}>
            Проект: jenmywdeyhmssmufuqti.supabase.co
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleCloudSync} className="btn-system" style={{ flexGrow: 1, fontSize: '11px', justifyContent: 'center' }}>
              ☁️ Сохранить в Облако
            </button>
            <button onClick={handleCloudLoad} className="btn-system btn-gold" style={{ flexGrow: 1, fontSize: '11px', justifyContent: 'center' }}>
              📥 Загрузить из Облака
            </button>
          </div>

          {cloudStatus && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--system-blue)', fontWeight: 600, textAlign: 'center' }}>
              {cloudStatus}
            </div>
          )}
        </div>

        {/* LOCAL JSON FILE BACKUP SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.25)', padding: '14px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>📥 Скачать бэкап (JSON)</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Сохранить локальный файл на ПК</div>
            </div>
            <button onClick={handleExport} className="btn-system" style={{ padding: '6px 12px', fontSize: '11px' }}>
              СКАЧАТЬ
            </button>
          </div>

          <div style={{ background: 'rgba(255, 215, 0, 0.06)', border: '1px solid rgba(255, 215, 0, 0.25)', padding: '14px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>📤 Восстановить из файла</div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Загрузить бэкап `.json`</div>
            </div>
            <label className="btn-system btn-gold" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '11px' }}>
              ВЫБРАТЬФАЙЛ
              <input type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {importStatus && (
          <div style={{ textAlign: 'center', marginTop: '14px', color: 'var(--system-blue)', fontWeight: 700, fontSize: '12px' }}>
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
}
