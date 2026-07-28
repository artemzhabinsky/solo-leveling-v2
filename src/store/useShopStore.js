/**
 * Shop & 24h Expiring Inventory Store (Zustand)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useShopStore = create()(
  persist(
    (set, get) => ({
      shopItems: [
        {
          id: 'shop-1',
          title: '1 Час любимой видеоигры',
          description: 'Отдохнуть и поиграть без угрызений совести.',
          icon: '🎮',
          price: 150
        },
        {
          id: 'shop-2',
          title: 'Заказать любимую пиццу',
          description: 'Вкусный ужин за зачистку дневных квестов.',
          icon: '🍕',
          price: 400
        },
        {
          id: 'shop-3',
          title: 'Просмотр фильма / серии сериала',
          description: 'Расслабляющий вечер за кино.',
          icon: '🎬',
          price: 200
        },
        {
          id: 'shop-4',
          title: 'Покупка новой вещи / Гаджета',
          description: 'Крупная награда за выполнение A/S-Ранг задач.',
          icon: '🎁',
          price: 2000
        }
      ],
      inventory: [
        {
          id: 'inv-1',
          itemId: 'shop-3',
          title: 'Просмотр фильма / серии сериала',
          icon: '🎬',
          purchasedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          usedAt: null,
          status: 'active' // 'active', 'used', 'expired'
        }
      ],

      addShopItem: (itemData) => {
        const newItem = {
          id: 'shop-' + Date.now(),
          title: itemData.title,
          description: itemData.description || '',
          icon: itemData.icon || '🎁',
          price: itemData.price
        };
        set((state) => ({ shopItems: [newItem, ...state.shopItems] }));
      },

      buyItem: (item) => {
        const now = Date.now();
        const expiresAt = new Date(now + 24 * 3600 * 1000).toISOString();

        const invRecord = {
          id: 'inv-' + now,
          itemId: item.id,
          title: item.title,
          icon: item.icon,
          purchasedAt: new Date(now).toISOString(),
          expiresAt,
          usedAt: null,
          status: 'active'
        };

        set((state) => ({
          inventory: [invRecord, ...state.inventory]
        }));

        return invRecord;
      },

      useInventoryItem: (invId) => {
        const { inventory } = get();
        const item = inventory.find(i => i.id === invId);
        if (!item || item.status !== 'active') return false;

        set({
          inventory: inventory.map(i => i.id === invId ? { ...i, status: 'used', usedAt: new Date().toISOString() } : i)
        });
        return true;
      },

      updateExpiredItems: () => {
        const { inventory } = get();
        const now = new Date().toISOString();
        let changed = false;

        const updated = inventory.map(item => {
          if (item.status === 'active' && item.expiresAt < now) {
            changed = true;
            return { ...item, status: 'expired' };
          }
          return item;
        });

        if (changed) {
          set({ inventory: updated });
        }
      }
    }),
    {
      name: 'SOLO_LEVELING_SHOP_STORE'
    }
  )
);
