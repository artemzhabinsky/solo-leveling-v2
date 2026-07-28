import React, { useState, useEffect } from 'react';
import { useShopStore } from '../../store/useShopStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { sfx } from '../../services/audioService.js';

export function RewardShopView() {
  const { shopItems, inventory, addShopItem, buyItem, useInventoryItem, updateExpiredItems } = useShopStore();
  const { gold, spendGold } = usePlayerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: 150, icon: '🎮' });

  useEffect(() => {
    updateExpiredItems();
    const timer = setInterval(() => updateExpiredItems(), 30000);
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

  return (
    <div>
      <div className="shop-header-banner" style={{ background: 'linear-gradient(135deg, rgba(20, 15, 40, 0.9), rgba(10, 25, 45, 0.9))', border: 'var(--border-gold)', boxShadow: 'var(--shadow-gold)', padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="font-system text-gold-glow" style={{ color: 'var(--system-gold)', fontSize: '22px' }}>🛍️ МАГАЗИН НАГРАД ("ХОТЕЛКИ")</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Обменивайте накопленные золотые монеты на реальные хотелки!</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-system btn-gold">
          <span>➕</span> НОВАЯ НАГРАДА
        </button>
      </div>

      {/* SHOP GRID */}
      <div className="shop-grid" style={{ marginTop: '20px' }}>
        {shopItems.map(item => {
          const canAfford = gold >= item.price;
          return (
            <div key={item.id} className="shop-item-card">
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
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

      {/* CREATE MODAL */}
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

export function InventoryListSection() {
  const { inventory, useInventoryItem } = useShopStore();

  return (
    <div className="daily-quest-panel" style={{ borderColor: 'var(--system-gold)' }}>
      <div className="daily-quest-header">
        <div className="daily-quest-title" style={{ color: 'var(--system-gold)' }}>
          📦 КУПЛЕННЫЕ НАГРАДЫ И 24-ЧАСОВОЙ ИНВЕНТАРЬ
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {inventory.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '30px' }}>У вас пока нет купленных наград.</div>
        ) : (
          inventory.map(inv => {
            const isUsed = inv.status === 'used';
            const isExpired = inv.status === 'expired';

            return (
              <div key={inv.id} style={{ background: 'rgba(5, 12, 28, 0.8)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{inv.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inv.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Срок использования (24ч): {new Date(inv.expiresAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <div>
                  {isUsed ? (
                    <span style={{ color: 'var(--system-green)', fontFamily: 'var(--font-system)', fontSize: '12px', fontWeight: 700 }}>✓ ИСПОЛЬЗОВАНО</span>
                  ) : isExpired ? (
                    <span style={{ color: 'var(--system-crimson)', fontFamily: 'var(--font-system)', fontSize: '12px', fontWeight: 700 }}>🔒 ИСТЕК СРОК (24ч)</span>
                  ) : (
                    <button onClick={() => useInventoryItem(inv.id)} className="btn-system btn-gold" style={{ padding: '6px 12px', fontSize: '11px' }}>
                      ⚡ ИСПОЛЬЗОВАТЬ
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
