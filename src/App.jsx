import React, { useState } from 'react';
import { Header } from './components/layout/Header.jsx';
import { NavTabs } from './components/layout/NavTabs.jsx';
import { StatusModal } from './components/modals/StatusModal.jsx';
import { LevelUpModal } from './components/modals/LevelUpModal.jsx';
import { PenaltyScreenModal } from './components/modals/PenaltyScreenModal.jsx';

import { TaskTrackerView } from './components/tasks/TaskTrackerView.jsx';
import { CharacterProfileView } from './components/character/CharacterProfileView.jsx';
import { DailyQuestsPanel } from './components/daily/DailyQuestsPanel.jsx';
import { RewardShopView, InventoryListSection } from './components/shop/RewardShopView.jsx';
import { AnalyticsView } from './components/analytics/AnalyticsView.jsx';

import { usePlayerStore } from './store/usePlayerStore.js';
import { sfx } from './services/audioService.js';

export function App() {
  const [activeTab, setActiveTab] = useState('tasks');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState(null);
  const [soundOn, setSoundOn] = useState(true);

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
    <div className="app-container">
      {/* Top Header */}
      <Header onOpenStatus={() => setIsStatusOpen(true)} />

      {/* Navigation Tabs */}
      <NavTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Tab Content */}
      <main>
        {activeTab === 'tasks' && <TaskTrackerView onShowLevelUp={setLevelUpData} />}
        {activeTab === 'character' && <CharacterProfileView />}
        {activeTab === 'daily' && <DailyQuestsPanel onShowLevelUp={setLevelUpData} />}
        {activeTab === 'shop' && <RewardShopView />}
        {activeTab === 'inventory' && <InventoryListSection />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>

      {/* Bottom Footer Toolbar */}
      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(0, 240, 255, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleResetData} className="btn-system btn-danger" style={{ padding: '6px 12px', fontSize: '11px' }}>
            🔄 Сбросить Прогресс
          </button>
        </div>

        <div>
          <button onClick={handleToggleSound} className="btn-system" style={{ padding: '6px 12px', fontSize: '11px' }}>
            {soundOn ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ'}
          </button>
        </div>
      </footer>

      {/* System Modals */}
      <StatusModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} />
      <LevelUpModal data={levelUpData} onClose={() => setLevelUpData(null)} />
      <PenaltyScreenModal />
    </div>
  );
}

export default App;
