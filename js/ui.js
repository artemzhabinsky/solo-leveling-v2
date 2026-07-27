/**
 * UI Renderer, Modal Handlers & Animation FX
 */
import { store, SystemState } from './state.js';
import { sound } from './sound.js';

export class UIManager {
  constructor() {
    this.activeTab = 'tasks'; // 'tasks', 'daily', 'shop', 'inventory'
    this.activeView = 'list'; // 'list', 'kanban', 'calendar'
  }

  init() {
    this.renderAll();
    this.bindEvents();
  }

  renderAll() {
    this.renderHeader();
    this.renderStatusModal();
  }

  // Render Header Player Stats
  renderHeader() {
    const player = store.data.player;
    const reqXp = SystemState.getRequiredXP(player.level);
    const rankInfo = SystemState.getRankInfo(player.level);
    const xpPercent = Math.min(100, Math.round((player.xp / reqXp) * 100));

    // Rank Badge
    const rankBadgeEl = document.getElementById('header-rank-badge');
    if (rankBadgeEl) {
      rankBadgeEl.className = `rank-badge rank-${rankInfo.rank}`;
      rankBadgeEl.textContent = rankInfo.rank + '-RANK';
    }

    // Player Info
    const playerNameEl = document.getElementById('header-player-name');
    if (playerNameEl) playerNameEl.textContent = player.name;

    const playerTitleEl = document.getElementById('header-player-title');
    if (playerTitleEl) playerTitleEl.textContent = rankInfo.title;

    // Level & XP Bar
    const levelNumEl = document.getElementById('header-level-num');
    if (levelNumEl) levelNumEl.textContent = player.level;

    const xpTextEl = document.getElementById('header-xp-text');
    if (xpTextEl) xpTextEl.textContent = `${player.xp} / ${reqXp} XP (${xpPercent}%)`;

    const xpFillEl = document.getElementById('header-xp-fill');
    if (xpFillEl) xpFillEl.style.width = `${xpPercent}%`;

    // Gold Coins
    const goldTextEl = document.getElementById('header-gold-text');
    if (goldTextEl) goldTextEl.textContent = player.gold.toLocaleString();

    // Stat Points Indicator
    const statBtn = document.getElementById('btn-open-status');
    if (statBtn) {
      if (player.statPoints > 0) {
        statBtn.classList.add('has-points');
        statBtn.textContent = `📊 СТАТУС (+${player.statPoints})`;
      } else {
        statBtn.classList.remove('has-points');
        statBtn.textContent = '📊 СТАТУС';
      }
    }
  }

  // Render Status Window Modal
  renderStatusModal() {
    const player = store.data.player;
    const rankInfo = SystemState.getRankInfo(player.level);

    const modalRank = document.getElementById('status-modal-rank');
    if (modalRank) modalRank.textContent = rankInfo.rank;

    const modalTitle = document.getElementById('status-modal-title');
    if (modalTitle) modalTitle.textContent = rankInfo.title;

    const modalPoints = document.getElementById('status-modal-points');
    if (modalPoints) modalPoints.textContent = player.statPoints;

    // Stat Values & Perks
    const stats = player.stats;
    this.updateStatRow('strength', stats.strength, `+${(stats.strength * 2)}% к заработку Золота`);
    this.updateStatRow('agility', stats.agility, `+${(stats.agility * 1)}% Скоростной бонус XP`);
    this.updateStatRow('sense', stats.sense, `${(stats.sense * 1.5).toFixed(1)}% Шанс Критического удвоения`);
    this.updateStatRow('vitality', stats.vitality, `Защита серий квестов и выносливость`);
    this.updateStatRow('intelligence', stats.intelligence, `+${(stats.intelligence * 2)}% Множитель Опыта (XP)`);
  }

  updateStatRow(statName, val, perkText) {
    const valEl = document.getElementById(`stat-val-${statName}`);
    if (valEl) valEl.textContent = val;

    const perkEl = document.getElementById(`stat-perk-${statName}`);
    if (perkEl) perkEl.textContent = perkText;

    const btnEl = document.getElementById(`btn-add-${statName}`);
    if (btnEl) {
      btnEl.style.display = store.data.player.statPoints > 0 ? 'flex' : 'none';
    }
  }

  // Show Toast Notification
  showToast(title, message, isCrit = false) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'system-notification';
    if (isCrit) {
      toast.style.borderColor = 'var(--system-gold)';
      toast.style.boxShadow = '0 0 25px rgba(255, 215, 0, 0.6)';
    }

    toast.innerHTML = `
      <div style="font-size: 24px;">${isCrit ? '⚡' : '📢'}</div>
      <div>
        <div class="notification-header">${title}</div>
        <div class="notification-body">${message}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Trigger Level Up Popup Modal
  showLevelUpModal(newLevel, statPointsGained) {
    sound.playLevelUp();
    this.triggerConfetti();

    const overlay = document.getElementById('levelup-modal-overlay');
    if (!overlay) return;

    const levelText = document.getElementById('levelup-modal-level');
    if (levelText) levelText.textContent = `УРОВЕНЬ ${newLevel}`;

    const pointsText = document.getElementById('levelup-modal-points');
    if (pointsText) pointsText.textContent = `+${statPointsGained} Очков Характеристик`;

    overlay.classList.add('active');
  }

  // Simple Canvas Particle Firework / Confetti Effect
  triggerConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#00f0ff', '#ffd700', '#00ff88', '#8a2be2', '#ffffff'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12 - 4,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.life > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.15; // gravity
          p.life -= 0.015;

          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    }

    animate();
  }

  bindEvents() {
    // Open Status Modal
    const btnStatus = document.getElementById('btn-open-status');
    const modalStatus = document.getElementById('status-modal-overlay');
    const btnCloseStatus = document.getElementById('btn-close-status');

    if (btnStatus && modalStatus) {
      btnStatus.addEventListener('click', () => {
        this.renderStatusModal();
        modalStatus.classList.add('active');
      });
    }
    if (btnCloseStatus && modalStatus) {
      btnCloseStatus.addEventListener('click', () => modalStatus.classList.remove('active'));
    }

    // Allocate Stat Point Buttons
    ['strength', 'agility', 'sense', 'vitality', 'intelligence'].forEach(stat => {
      const btn = document.getElementById(`btn-add-${stat}`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (store.allocateStat(stat)) {
            sound.playStatClick();
            this.renderHeader();
            this.renderStatusModal();
          }
        });
      }
    });

    // Close Levelup Modal
    const btnCloseLevelup = document.getElementById('btn-close-levelup');
    const modalLevelup = document.getElementById('levelup-modal-overlay');
    if (btnCloseLevelup && modalLevelup) {
      btnCloseLevelup.addEventListener('click', () => modalLevelup.classList.remove('active'));
    }

    // Navigation Tabs
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetTab = btn.getAttribute('data-tab');
        this.activeTab = targetTab;
        this.switchTabSection(targetTab);
      });
    });
  }

  switchTabSection(tabName) {
    document.querySelectorAll('.tab-content-section').forEach(sec => {
      sec.style.display = 'none';
    });

    const targetSection = document.getElementById(`section-${tabName}`);
    if (targetSection) {
      targetSection.style.display = 'block';
    }
  }
}

export const ui = new UIManager();
