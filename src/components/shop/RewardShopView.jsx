import React, { useState, useEffect } from 'react';
import { useShopStore } from '../../store/useShopStore.js';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { sfx } from '../../services/audioService.js';

export function RewardShopView() {
  const {
    catalog,
    inventory,
    customRewardTitle,
    customRewardCost,
    customRewardEmoji,
    setCustomRewardTitle,
    setCustomRewardCost,
    setCustomRewardEmoji,
    addCustomReward,
    deleteCatalogItem,
    buyReward,
    useInventoryItem,
    cleanExpiredInventory
  } = useShopStore();

  const { gold, totalGoldEarned, spendGold, healHp, activateShield, hasShield, hp } = usePlayerStore();
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [, setTick] = useState(0);

  // 1-second interval to update remaining 24-hour countdown timers & clean expired items
  useEffect(() => {
    cleanExpiredInventory();
    const interval = setInterval(() => {
      cleanExpiredInventory();
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBuy = (item) => {
    if (gold < item.cost) {
      alert('Недостаточно монет! Выполняйте квесты, чтобы заработать золото.');
      return;
    }
    const bought = buyReward(item, spendGold);
    if (bought) {
      sfx.playBuy();
    }
  };

  const handleUseItem = (invItem) => {
    if (invItem.isPotion) {
      if (invItem.potionType === 'heal_hp') {
        if (hp >= 3) {
          alert('❤️ У вас уже максимальное количество здоровья (3/3 HP)! Зелье пока не требуется.');
          return;
        }
        healHp(1);
        useInventoryItem(invItem.id);
        sfx.playLevelUp();
        alert('🧪 Зелье использовано! Восстановлено +1 HP!');
        return;
      }
      if (invItem.potionType === 'shield') {
        if (hasShield) {
          alert('🛡️ У вас уже активен «Щит от Прокрастинации»!');
          return;
        }
        activateShield();
        useInventoryItem(invItem.id);
        sfx.playLevelUp();
        alert('🛡️ «Щит от Прокрастинации» успешно активирован!');
        return;
      }
    }

    useInventoryItem(invItem.id);
    sfx.playQuestComplete();
  };

  const handleCreateCustomSubmit = (e) => {
    e.preventDefault();
    if (!customRewardTitle.trim()) return;
    addCustomReward();
    setIsCustomModalOpen(false);
  };

  const formatTimeLeft = (expiresAtIso) => {
    const diffMs = new Date(expiresAtIso).getTime() - Date.now();
    if (diffMs <= 0) return 'Истёк';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${hours}ч ${mins}мин ${secs}сек`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner with Clean Title */}
      <div style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.2)', paddingBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--system-gold)', fontFamily: 'var(--font-orbitron)', letterSpacing: '2px', fontWeight: 700 }}>
          ◆ ОБМЕН МОНЕТ
        </div>
        <h1 className="font-orbitron text-gold-glow" style={{ fontSize: '28px', color: '#ffffff', letterSpacing: '1px', marginTop: '4px' }}>
          МАГАЗИН НАГРАД И БУСТОВ
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
          Покупайте реальные награды и системные бусты за заработанные монеты.
        </div>
      </div>

      {/* Side-by-Side Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* LEFT COLUMN: Каталог Наград */}
        <div className="task-section-card-container" style={{ borderColor: 'rgba(255, 215, 0, 0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '18px' }}>Каталог наград</h3>
            <button onClick={() => setIsCustomModalOpen(true)} className="btn-system btn-gold" style={{ fontSize: '11px', padding: '6px 12px' }}>
              + СВОЯ НАГРАДА
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
            {catalog.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>Наград пока нет. Добавьте свою!</div>
            ) : (
              catalog.map(item => {
                const canAfford = gold >= item.cost;
                return (
                  <div key={item.id} className="task-item-card" style={{ borderColor: item.isPotion ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 215, 0, 0.2)' }}>
                    <div className="shop-emoji-box" style={{ background: item.isPotion ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 215, 0, 0.1)' }}>
                      {item.emoji}
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div className="task-title" style={{ fontSize: '15px', fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{item.description}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`btn-system ${canAfford ? 'btn-gold' : ''}`}
                        style={{ opacity: canAfford ? 1 : 0.4, cursor: canAfford ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '13px' }}
                      >
                        🪙 {item.cost}
                      </button>

                      {!item.isPotion && (
                        <button
                          onClick={() => deleteCatalogItem(item.id)}
                          className="btn-system btn-danger"
                          style={{ padding: '6px 8px', fontSize: '12px' }}
                          title="Удалить награду"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Инвентарь */}
        <div className="task-section-card-container" style={{ borderColor: 'rgba(0, 240, 255, 0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '18px' }}>Инвентарь</h3>
            <span style={{ fontSize: '11px', color: 'var(--system-blue)', fontWeight: 600 }}>
              АКТИВНО: {inventory.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
            {inventory.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px 20px', lineHeight: '1.6' }}>
                Ничего не куплено.<br />Награда сгорает через 24 часа после покупки.
              </div>
            ) : (
              inventory.map(invItem => (
                <div key={invItem.id} className="task-item-card" style={{ borderColor: 'rgba(0, 240, 255, 0.3)', background: 'rgba(5, 15, 35, 0.9)' }}>
                  <div className="shop-emoji-box" style={{ background: 'rgba(0, 240, 255, 0.1)', borderColor: 'rgba(0, 240, 255, 0.3)' }}>
                    {invItem.emoji}
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div className="task-title" style={{ fontSize: '15px', fontWeight: 600 }}>{invItem.title}</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>⏳ Сгорит через:</span>
                      <span style={{ fontSize: '12px', color: 'var(--system-crimson)', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                        {formatTimeLeft(invItem.expiresAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUseItem(invItem)}
                    className="btn-system"
                    style={{ background: 'rgba(0, 255, 136, 0.15)', borderColor: '#00ff88', color: '#00ff88', fontSize: '12px', whiteSpace: 'nowrap' }}
                  >
                    ✓ Использовать
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Clean Bottom Summary Footer */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(255, 215, 0, 0.3)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'var(--system-gold)', fontWeight: 700, letterSpacing: '0.5px' }}>
          ВСЕГО ЗАРАБОТАНО МОНЕТ ЗА ВСЁ ВРЕМЯ: 🪙 {totalGoldEarned ? totalGoldEarned.toLocaleString() : 0}
        </div>
      </div>

      {/* CREATE CUSTOM REWARD MODAL */}
      {isCustomModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 215, 0, 0.3)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 className="font-system text-gold-glow" style={{ color: 'var(--system-gold)', fontSize: '18px' }}>+ ДОБАВИТЬ СВОЮ НАГРАДУ</h2>
              <button onClick={() => setIsCustomModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCreateCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontWeight: 600 }}>НАЗВАНИЕ НАГРАДЫ</label>
                <input
                  type="text"
                  value={customRewardTitle}
                  onChange={(e) => setCustomRewardTitle(e.target.value)}
                  className="input-system"
                  placeholder="Например: Поездка на выходных..."
                  required
                  style={{ marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontWeight: 600 }}>СТОИМОСТЬ В МОНЕТАХ</label>
                  <input
                    type="number"
                    value={customRewardCost}
                    onChange={(e) => setCustomRewardCost(e.target.value)}
                    className="input-system"
                    min="1"
                    required
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--system-gold)', fontWeight: 600 }}>ЭМОДЗИ ИКОНКА</label>
                  <select
                    value={customRewardEmoji}
                    onChange={(e) => setCustomRewardEmoji(e.target.value)}
                    className="select-system"
                    style={{ marginTop: '4px' }}
                  >
                    <option value="🎁">🎁 Подарок</option>
                    <option value="🍕">🍕 Пицца / Еда</option>
                    <option value="🎮">🎮 Игры</option>
                    <option value="🎬">🎬 Кино</option>
                    <option value="🚗">🚗 Поездка</option>
                    <option value="💆">💆 Отдых</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-system btn-gold" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                ДОБАВИТЬ В КАТАЛОГ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
