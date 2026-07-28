/**
 * Shop & Inventory Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const INITIAL_SHOP_ITEMS = [
  { id: 'shop-1', title: 'Час игр на консоли / ПК', cost: 150, emoji: '🎮', description: 'Заслуженная игровая сессия после хорошей работы.' },
  { id: 'shop-2', title: 'Вкусный сет пиццы / бургер', cost: 200, emoji: '🍕', description: 'Гастрономический праздник за закрытые задачи.' },
  { id: 'shop-3', title: 'Просмотр фильма / сериала', cost: 100, emoji: '🎬', description: 'Уютный вечер кинематографа без чувства вины.' },
  { id: 'shop-4', title: 'Новый гаджет / аксессуар', cost: 1000, emoji: '🎁', description: 'Крупная награда за серьезные свершения.' }
];

export const useShopStore = create()(
  persist(
    (set, get) => ({
      catalog: INITIAL_SHOP_ITEMS,
      inventory: [], // [{ id, shopItemId, title, cost, emoji, description, purchasedAt, expiresAt }]
      customRewardTitle: '',
      customRewardCost: 100,
      customRewardEmoji: '🎁',

      setCustomRewardTitle: (val) => set({ customRewardTitle: val }),
      setCustomRewardCost: (val) => set({ customRewardCost: Number(val) || 50 }),
      setCustomRewardEmoji: (val) => set({ customRewardEmoji: val }),

      addCustomReward: () => {
        const { customRewardTitle, customRewardCost, customRewardEmoji, catalog } = get();
        if (!customRewardTitle.trim()) return;

        const newItem = {
          id: 'custom-' + Date.now(),
          title: customRewardTitle.trim(),
          cost: Math.max(1, customRewardCost),
          emoji: customRewardEmoji || '🎁',
          description: 'Пользовательская награда'
        };

        set({
          catalog: [newItem, ...catalog],
          customRewardTitle: '',
          customRewardCost: 100,
          customRewardEmoji: '🎁'
        });
      },

      buyReward: (item, spendGoldFn) => {
        const success = spendGoldFn(item.cost);
        if (!success) return false;

        const now = Date.now();
        const expiresAt = new Date(now + 24 * 3600 * 1000).toISOString();

        const purchasedRecord = {
          id: 'inv-' + Date.now(),
          shopItemId: item.id,
          title: item.title,
          cost: item.cost,
          emoji: item.emoji,
          description: item.description,
          purchasedAt: new Date().toISOString(),
          expiresAt
        };

        set((state) => ({
          inventory: [purchasedRecord, ...state.inventory]
        }));

        return true;
      },

      useInventoryItem: (inventoryId) => {
        set((state) => ({
          inventory: state.inventory.filter(item => item.id !== inventoryId)
        }));
      },

      cleanExpiredInventory: () => {
        const { inventory } = get();
        const nowIso = new Date().toISOString();
        const fresh = inventory.filter(item => item.expiresAt > nowIso);
        if (fresh.length !== inventory.length) {
          set({ inventory: fresh });
        }
      }
    }),
    {
      name: 'SOLO_LEVELING_SHOP_STORE'
    }
  )
);
