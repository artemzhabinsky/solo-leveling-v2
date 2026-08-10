import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header.jsx';
import { SidebarNav } from './components/layout/SidebarNav.jsx';
import { BottomTouchbar } from './components/layout/BottomTouchbar.jsx';

import { LevelUpModal } from './components/modals/LevelUpModal.jsx';
import { PenaltyScreenModal } from './components/modals/PenaltyScreenModal.jsx';
import { BackupModal } from './components/modals/BackupModal.jsx';

import { TaskTrackerView } from './components/tasks/TaskTrackerView.jsx';
import { CharacterProfileView } from './components/character/CharacterProfileView.jsx';
import { DailyQuestsPanel } from './components/daily/DailyQuestsPanel.jsx';
import { RewardShopView } from './components/shop/RewardShopView.jsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.jsx';

import { usePlayerStore } from './store/usePlayerStore.js';
import { useTaskStore } from './store/useTaskStore.js';
import { useShopStore } from './store/useShopStore.js';
import { useDailyQuestStore } from './store/useDailyQuestStore.js';
import { triggerDebouncedCloudSync, syncStateToCloud, subscribeSyncStatus } from './services/supabaseSync.js';
import { sfx } from './services/audioService.js';

export function App() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [cloudSyncState, setCloudSyncState] = useState('synced');

  const { resetProgress } = usePlayerStore();

  // Automatic Background Supabase Cloud Sync Subscriptions & Status Listener
  useEffect(() => {
    const unsubStatus = subscribeSyncStatus((status) => {
      setCloudSyncState(status);
    });

    const unsubPlayer = usePlayerStore.subscribe(() => triggerDebouncedCloudSync());
    const unsubTasks = useTaskStore.subscribe(() => triggerDebouncedCloudSync());
    const unsubShop = useShopStore.subscribe(() => triggerDebouncedCloudSync());
    const unsubDaily = useDailyQuestStore.subscribe(() => triggerDebouncedCloudSync());

    // Initial background sync push
    syncStateToCloud();

    return () => {
      unsubStatus();
      unsubPlayer();
      unsubTasks();
      unsubShop();
      unsubDaily();
    };
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    sfx.toggle(next);
  };

  const handleResetData = () => {
    if (window.confirm('Сбросить весь прогресс и вернуть начальные данные?')) {
      resetProgress();
    }
  };

  const renderCloudBadge = () => {
    if (cloudSyncState === 'saving' || cloudSyncState === 'pending') {
      return <span style={{ fontSize: '11px', color: 'var(--system-gold)', fontWeight: 600 }}>☁️ Облако: Сохранение...</span>;
    }
    if (cloudSyncState === 'error') {
      return <span style={{ fontSize: '11px', color: 'var(--system-crimson)', fontWeight: 600 }}>☁️ Облако: Ошибка</span>;
    }
    return <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 600 }}>☁️ Облако: Авто-синхронизировано ✓</span>;
  };

  return (
    <div className="system-app-layout">
      {/* Collapsible Sidebar Navigation (Desktop) */}
      <SidebarNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Body */}
      <div className="system-main-content">
        <Header onOpenBackup={() => setIsBackupModalOpen(true)} />

        {/* Dynamic Tab Views */}
        <main className="tab-page-container">
          {activeTab === 'tasks' && <TaskTrackerView onShowLevelUp={setLevelUpData} />}
          {activeTab === 'character' && <CharacterProfileView />}
          {activeTab === 'daily' && <DailyQuestsPanel onShowLevelUp={setLevelUpData} />}
          {activeTab === 'shop' && <RewardShopView />}
          {activeTab === 'analytics' && <AnalyticsView />}
        </main>

        {/* Footer Toolbar */}
        <footer className="system-footer-toolbar" style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px solid rgba(0, 240, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleResetData} className="btn-system btn-danger" style={{ padding: '6px 12px', fontSize: '11px' }}>
              🔄 СБРОСИТЬ ПРОГРЕСС
            </button>
            <button onClick={() => setIsBackupModalOpen(true)} className="btn-system btn-gold" style={{ padding: '6px 12px', fontSize: '11px' }}>
              💾 БЭКАП И СОХРАНЕНИЕ
            </button>
            <div style={{ background: 'rgba(5, 12, 30, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '6px 12px', borderRadius: '8px' }}>
              {renderCloudBadge()}
            </div>
          </div>

          <div>
            <button onClick={handleToggleSound} className="btn-system" style={{ padding: '6px 12px', fontSize: '11px' }}>
              {soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ'}
            </button>
          </div>
        </footer>
      </div>

      {/* Bottom Touchbar Navigation (Mobile Only) */}
      <BottomTouchbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* System Modals */}
      <LevelUpModal data={levelUpData} onClose={() => setLevelUpData(null)} />
      <PenaltyScreenModal />
      <BackupModal isOpen={isBackupModalOpen} onClose={() => setIsBackupModalOpen(false)} />
    </div>
  );
}

export default App;
