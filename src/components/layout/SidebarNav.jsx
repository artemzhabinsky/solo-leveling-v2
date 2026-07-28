import React from 'react';
import { PanelLeftClose, PanelLeft, Sword, User, Flame, ShoppingBag, BarChart3 } from 'lucide-react';

export function SidebarNav({ activeTab, onTabChange, isCollapsed, onToggleCollapse }) {
  const menuItems = [
    { id: 'tasks', label: 'Все задачи', icon: Sword },
    { id: 'character', label: 'Профиль персонажа', icon: User },
    { id: 'daily', label: 'Ежедневные квесты', icon: Flame },
    { id: 'shop', label: 'Магазин наград', icon: ShoppingBag },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 }
  ];

  return (
    <aside className={`system-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isCollapsed && <span className="sidebar-brand">SYSTEM NAV</span>}
        <button onClick={onToggleCollapse} className="btn-sidebar-toggle" title={isCollapsed ? 'Развернуть меню' : 'Свернуть меню'}>
          {isCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`sidebar-menu-btn ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <IconComp size={20} className="sidebar-icon" />
              {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
