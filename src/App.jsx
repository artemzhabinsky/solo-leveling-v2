import React, { useState } from 'react';
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
import { sfx } from './services/audioService.js';

export function App() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const { resetProgress } = usePlayerStore();

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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={handleResetData} className="btn-system btn-danger" style={{ padding: '6px 12px', fontSize: '11px' }}>
              🔄 СБРОСИТЬ ПРОГРЕСС
            </button>
            <button onClick={() => setIsBackupModalOpen(true)} className="btn-system btn-gold" style={{ padding: '6px 12px', fontSize: '11px' }}>
              💾 БЭКАП И СОХРАНЕНИЕ
            </button>
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
