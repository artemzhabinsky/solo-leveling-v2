import React from 'react';
import { Sword, User, Flame, ShoppingBag, Package, BarChart3 } from 'lucide-react';

export function BottomTouchbar({ activeTab, onTabChange }) {
  const menuItems = [
    { id: 'tasks', label: 'Задачи', icon: Sword },
    { id: 'character', label: 'Профиль', icon: User },
    { id: 'daily', label: 'Квесты', icon: Flame },
    { id: 'shop', label: 'Магазин', icon: ShoppingBag },
    { id: 'inventory', label: 'Награды', icon: Package },
    { id: 'analytics', label: 'Анализ', icon: BarChart3 }
  ];

  return (
    <nav className="mobile-bottom-touchbar">
      {menuItems.map((item) => {
        const IconComp = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`touchbar-btn ${isActive ? 'active' : ''}`}
          >
            <IconComp size={20} />
            <span className="touchbar-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
