import React from 'react';

export function NavTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'tasks', label: '⚔️ ВСЕ ЗАДАЧИ' },
    { id: 'character', label: '👤 ПРОФИЛЬ ПЕРСОНАЖА' },
    { id: 'daily', label: '🔥 ЕЖЕДНЕВНЫЕ КВЕСТЫ' },
    { id: 'shop', label: '🛍️ МАГАЗИН НАГРАД' },
    { id: 'inventory', label: '📦 КУПЛЕННЫЕ НАГРАДЫ' },
    { id: 'analytics', label: '📊 АНАЛИТИКА & ЧАРТЫ' }
  ];

  return (
    <nav className="system-nav-tabs">
      {tabs.map((t) => (
        <button
          key={t.id}
          className={`nav-tab-btn ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onTabChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
