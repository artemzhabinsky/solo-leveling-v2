/**
 * Reward Shop ("Хотелки") & Inventory Manager
 */
import { store } from './state.js';
import { ui } from './ui.js';
import { sound } from './sound.js';

export class ShopManager {
  init() {
    this.renderShop();
    this.renderInventory();
    this.bindEvents();
  }

  renderShop() {
    const grid = document.getElementById('shop-grid-items');
    if (!grid) return;

    if (store.data.shopItems.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px;">В магазине пока нет наград. Нажмите "+ Новая Награда", чтобы добавить свои хотелки!</div>`;
      return;
    }

    grid.innerHTML = store.data.shopItems.map(item => {
      const canAfford = store.data.player.gold >= item.price;
      return `
        <div class="shop-item-card">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div class="item-icon-badge">${item.icon || '🎁'}</div>
            <div class="item-info">
              <div class="item-name">${this.escapeHtml(item.title)}</div>
              <div class="item-description">${this.escapeHtml(item.description || '')}</div>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
            <div class="item-price-tag">🪙 ${item.price.toLocaleString()}</div>
            <button class="btn-buy-reward btn-buy-item" data-id="${item.id}" ${canAfford ? '' : 'disabled'}>
              ${canAfford ? '🛒 КУПИТЬ' : '🔒 МАЛО МОНЕТ'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.btn-buy-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const res = store.buyShopItem(id);
        if (res.success) {
          sound.playPurchase();
          ui.renderHeader();
          this.renderShop();
          this.renderInventory();
          ui.showToast('НАГРАДА КУПЛЕНА! 🎁', `Вы разблокировали "${res.invItem.title}"! Наслаждайтесь!`, true);
        } else {
          ui.showToast('ОШИБКА ⚠️', res.message);
        }
      });
    });
  }

  renderInventory() {
    const container = document.getElementById('inventory-list-container');
    if (!container) return;

    if (store.data.inventory.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 30px;">У вас пока нет купленных наград. Выполняйте задачи и зарабатывайте монеты!</div>`;
      return;
    }

    container.innerHTML = store.data.inventory.map(inv => {
      const d = new Date(inv.purchasedAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      return `
        <div class="inventory-item-row">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">${inv.icon || '🎁'}</span>
            <div>
              <div class="inventory-item-title">${this.escapeHtml(inv.title)}</div>
              <div class="inventory-item-date">Куплено: ${d}</div>
            </div>
          </div>
          <span style="color: var(--system-green); font-family: var(--font-system); font-size: 13px; font-weight: 700;">✓ РАЗБЛОКИРОВАНО</span>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    const btnOpenModal = document.getElementById('btn-open-new-shop-item');
    const modalShop = document.getElementById('shop-modal-overlay');
    const btnCloseModal = document.getElementById('btn-close-shop-modal');
    const formShop = document.getElementById('form-create-shop-item');

    if (btnOpenModal && modalShop) {
      btnOpenModal.addEventListener('click', () => modalShop.classList.add('active'));
    }
    if (btnCloseModal && modalShop) {
      btnCloseModal.addEventListener('click', () => modalShop.classList.remove('active'));
    }

    if (formShop) {
      formShop.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('shop-input-title').value.trim();
        const description = document.getElementById('shop-input-desc').value.trim();
        const price = parseInt(document.getElementById('shop-input-price').value, 10);
        const icon = document.getElementById('shop-input-icon').value.trim() || '🎁';

        if (!title || isNaN(price) || price <= 0) return;

        const newItem = {
          id: 'shop-' + Date.now(),
          title,
          description,
          price,
          icon,
          category: 'Хотелки'
        };

        store.addShopItem(newItem);
        formShop.reset();
        modalShop.classList.remove('active');
        this.renderShop();
        ui.showToast('ХОТЕЛКА ДОБАВЛЕНА 🎁', `Предмет "${title}" добавлен в магазин наград!`);
      });
    }
  }

  escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

export const shopMgr = new ShopManager();
