import React, { useState, useEffect } from 'react';
import { useShopStore } from '../../store/useShopStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { sfx } from '../../services/audioService.js';

export function RewardShopView() {
  const { shopItems, inventory, addShopItem, buyItem, useInventoryItem, deleteInventoryItem, cleanExpiredInventory } = useShopStore();
  const { gold, totalGoldEarned, spendGold } = usePlayerStore();

  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' or 'inventory'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: 150, icon: '🎮' });
  const [nowTime, setNowTime] = useState(Date.now());

  // 1-second interval to update live countdown timers & clean expired items
  useEffect(() => {
    cleanExpiredInventory();
    const timer = setInterval(() => {
      setNowTime(Date.now());
      cleanExpiredInventory();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBuy = (item) => {
    if (spendGold(item.price)) {
      sfx.playPurchase();
      buyItem(item);
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim() || form.price <= 0) return;
    addShopItem(form);
    setForm({ title: '', description: '', price: 150, icon: '🎮' });
    setIsModalOpen(false);
  };

  // Helper to format 24h countdown
  const getRemainingTime = (expiresAtIso) => {
    const diff = new Date(expiresAtIso).getTime() - nowTime;
    if (diff <= 0) return 'Истёк';
    const hours = Math.floor(diff / (1000 * 3600));
    const mins = Math.floor((diff % (1000 * 3600)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}ч ${mins}мин ${secs}сек`;
  };

  const activeInventory = inventory.filter(i => new Date(i.expiresAt).getTime() > nowTime);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Sub-Tab Switcher */}
      <div className="shop-header-banner" style={{ background: 'linear-gradient(135deg, rgba(20, 15, 40, 0.9), rgba(10, 25, 45, 0.9))', border: 'var(--border-gold)', boxShadow: 'var(--shadow-gold)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="font-system text-gold-glow" style={{ color: 'var(--system-gold)', fontSize: '22px' }}>🛍️ МАГАЗИН НАГРАД-ХОТЕЛКИ</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Обменивайте накопленные золотые монеты на реальные награды и хотелки!</p>
          </div>
          {activeSubTab === 'catalog' && (
            <button onClick={() => setIsModalOpen(true)} className="btn-system btn-gold">
              <span>➕</span> НОВАЯ НАГРАДА
            </button>
          )}
        </div>

        {/* Sub-Tab Switcher */}
        <div className="view-switcher" style={{ width: 'fit-content', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <button onClick={() => setActiveSubTab('catalog')} className={`view-btn ${activeSubTab === 'catalog' ? 'active' : ''}`} style={{ color: activeSubTab === 'catalog' ? 'var(--system-gold)' : undefined }}>
            🛍️ КАТАЛОГ НАГРАД
          </button>
          <button onClick={() => setActiveSubTab('inventory')} className={`view-btn ${activeSubTab === 'inventory' ? 'active' : ''}`} style={{ color: activeSubTab === 'inventory' ? 'var(--system-gold)' : undefined }}>
            📦 КУПЛЕННЫЕ НАГРАДЫ ({activeInventory.length})
          </button>
        </div>
      </div>

      {/* CATALOG SUB-TAB */}
      {activeSubTab === 'catalog' && (
        <div className="shop-grid">
          {shopItems.map(item => {
            const canAfford = gold >= item.price;
            return (
              <div key={item.id} className="shop-item-card">
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{item.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                  <div style={{ fontFamily: 'var(--font-system)', fontSize: '18px', fontWeight: 800, color: 'var(--system-gold)' }}>
                    🪙 {item.price.toLocaleString()}
                  </div>
                  <button onClick={() => handleBuy(item)} disabled={!canAfford} className="btn-system btn-gold" style={{ opacity: canAfford ? 1 : 0.4 }}>
                    {canAfford ? '🛒 КУПИТЬ' : '🔒 МАЛО МОНЕТ'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INVENTORY SUB-TAB (24-HOUR COUNTDOWN & AUTO-DELETE) */}
      {activeSubTab === 'inventory' && (
        <div className="daily-quest-panel" style={{ borderColor: 'var(--system-gold)' }}>
          <div className="daily-quest-header">
            <div className="daily-quest-title" style={{ color: 'var(--system-gold)' }}>
              📦 КУПЛЕННЫЕ НАГРАДЫ (СГОРАЮТ ЧЕРЕЗ 24 ЧАСА)
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            {activeInventory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>
                У вас пока нет купленных наград. Купите награду в Каталоге!
              </div>
            ) : (
              activeInventory.map(inv => {
                const isUsed = inv.status === 'used';
                const timerStr = getRemainingTime(inv.expiresAt);

                return (
                  <div key={inv.id} style={{ background: 'rgba(5, 12, 28, 0.8)', border: '1px solid rgba(255, 215, 0, 0.25)', borderRadius: '8px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{ fontSize: '28px' }}>{inv.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px' }}>{inv.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--system-gold)', fontFamily: 'var(--font-system)', marginTop: '3px' }}>
                          ⏱️ Осталось времени (24ч): <strong style={{ color: '#ffffff' }}>{timerStr}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isUsed ? (
                        <span style={{ color: 'var(--system-green)', fontFamily: 'var(--font-system)', fontSize: '12px', fontWeight: 700 }}>✓ ИСПОЛЬЗОВАНО</span>
                      ) : (
                        <button onClick={() => useInventoryItem(inv.id)} className="btn-system btn-gold" style={{ padding: '6px 14px', fontSize: '12px' }}>
                          ⚡ ИСПОЛЬЗОВАТЬ
                        </button>
                      )}
                      <button onClick={() => deleteInventoryItem(inv.id)} className="btn-system btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>🗑️</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TOTAL COINS EARNED COUNTER AT BOTTOM */}
      <div style={{ background: 'rgba(5, 12, 28, 0.9)', border: '1px solid rgba(255, 215, 0, 0.3)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🏆</span>
          <div>
            <div style={{ fontFamily: 'var(--font-system)', fontSize: '13px', color: 'var(--system-gold)' }}>СТАТИСТИКА ДОСТИЖЕНИЙ</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Суммарный объем накоплений игрока</div>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--font-system)', fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
          ВСЕГО ЗАРАБОТАНО МОНЕТ ЗА ВСЁ ВРЕМЯ: <span style={{ color: 'var(--system-gold)', fontSize: '20px' }}>🪙 {totalGoldEarned.toLocaleString()}</span>
        </div>
      </div>

      {/* CREATE ITEM MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 215, 0, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 className="font-system text-gold-glow" style={{ color: 'var(--system-gold)', fontSize: '18px' }}>🎁 ДОБАВИТЬ ХОТЕЛКУ</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontFamily: 'var(--font-system)' }}>НАЗВАНИЕ НАГРАДЫ</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-system" placeholder="Например: Поиграть в PS5..." required style={{ marginTop: '4px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontFamily: 'var(--font-system)' }}>ОПИСАНИЕ</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-system" placeholder="Описание..." style={{ marginTop: '4px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontFamily: 'var(--font-system)' }}>СТОИМОСТЬ 🪙</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value, 10) })} className="input-system" min="10" required style={{ marginTop: '4px' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontFamily: 'var(--font-system)' }}>ИКОНКА EMOJI</label>
                  <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input-system" style={{ marginTop: '4px' }} />
                </div>
              </div>
              <button type="submit" className="btn-system btn-gold" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                🛍️ ДОБАВИТЬ В МАГАЗИН
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
