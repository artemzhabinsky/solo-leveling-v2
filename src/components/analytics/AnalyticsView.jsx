import React, { useState, useEffect } from 'react';
import { usePlayerStore } from '../../store/usePlayerStore.js';
import { useTaskStore } from '../../store/useTaskStore.js';
import { useShopStore } from '../../store/useShopStore.js';
import { AchievementModal } from '../modals/AchievementModal.jsx';
import { sfx } from '../../services/audioService.js';

export function AnalyticsView() {
  const { stats, level, dailyStreak, analyticsLogs, systemEvents, activeTitle, unlockedTitles, equipTitle, unlockTitle } = usePlayerStore();
  const { tasks } = useTaskStore();
  const { inventory } = useShopStore();

  const [unlockedPopupAchievement, setUnlockedPopupAchievement] = useState(null);

  // 1. Radar Chart Axes Calculations (Normalized 0-100)
  const maxAttrVal = Math.max(stats.strength, stats.intelligence, stats.vitality, stats.goldBonus, stats.sense, 15);
  
  const strPct = Math.round((stats.strength / maxAttrVal) * 100);
  const intPct = Math.round((stats.intelligence / maxAttrVal) * 100);
  const vitPct = Math.round((stats.vitality / maxAttrVal) * 100);
  const goldPct = Math.round((stats.goldBonus / maxAttrVal) * 100);
  const discPct = Math.round((stats.sense / maxAttrVal) * 100);

  // Radar SVG Math (Center 120,120 Radius 80)
  const cx = 120, cy = 120, r = 80;
  const angles = [-Math.PI / 2, -Math.PI / 10, 3 * Math.PI / 10, 7 * Math.PI / 10, 11 * Math.PI / 10];
  
  const getPoint = (pct, i) => {
    const radius = (pct / 100) * r;
    const x = cx + radius * Math.cos(angles[i]);
    const y = cy + radius * Math.sin(angles[i]);
    return `${x},${y}`;
  };

  const pointsString = `${getPoint(strPct, 0)} ${getPoint(intPct, 1)} ${getPoint(vitPct, 2)} ${getPoint(goldPct, 3)} ${getPoint(discPct, 4)}`;

  // 2. 7-Day XP & Category Stats Calculations
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyXpData = last7Days.map(dateStr => {
    const log = analyticsLogs.find(l => l.date === dateStr);
    const dayName = new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'short' });
    const hasPenalty = systemEvents.some(ev => ev.eventType === 'penalty_reset' && ev.occurredAt.startsWith(dateStr));
    return {
      date: dateStr,
      dayName: dayName.toUpperCase(),
      xp: log ? log.xpGained : 0,
      tasks: log ? log.tasksCompleted : 0,
      hasPenalty
    };
  });

  const maxXp7Days = Math.max(...dailyXpData.map(d => d.xp), 500);

  // Category breakdown for last 7 days
  const catTotals = { physical: 0, mental: 0, spirit: 0, finance: 0, discipline: 0 };
  let totalClosed7Days = 0;

  analyticsLogs.forEach(log => {
    if (last7Days.includes(log.date) && log.categoryBreakdown) {
      Object.entries(log.categoryBreakdown).forEach(([cat, count]) => {
        if (catTotals[cat] !== undefined) {
          catTotals[cat] += count;
          totalClosed7Days += count;
        }
      });
    }
  });

  // 3. System Achievements List & Condition Checks
  const doneTasksCount = tasks.filter(t => t.status === 'done').length;
  const doneSTasksCount = tasks.filter(t => t.status === 'done' && t.rank === 'S').length;

  const ACHIEVEMENTS = [
    {
      id: 'ach-1',
      title: '🌅 Ранняя пташка',
      description: 'Выполнить хотя бы 3 квеста в журнале.',
      rewardTitle: 'Покоритель Зари',
      unlocked: doneTasksCount >= 3
    },
    {
      id: 'ach-2',
      title: '⚡ Режим Гиперскорости',
      description: 'Выполнить 5 задач за один день.',
      rewardTitle: 'Бегущий по Молниям',
      unlocked: dailyXpData.some(d => d.tasks >= 5)
    },
    {
      id: 'ach-3',
      title: '🔥 Стальной Стрик',
      description: 'Продержать ежедневный стрик 7 дней подряд.',
      rewardTitle: 'Мастер Дисциплины',
      unlocked: dailyStreak >= 7
    },
    {
      id: 'ach-4',
      title: '🛒 Теневой Покупатель',
      description: 'Приобрести хотя бы 1 награду в Магазине.',
      rewardTitle: 'Властелин Наград',
      unlocked: inventory.length > 0
    },
    {
      id: 'ach-5',
      title: '🎯 Охотник S-Ранга',
      description: 'Завершить хотя бы 1 сложнейшую задачу S-ранга.',
      rewardTitle: 'Сокрушитель Боссов',
      unlocked: doneSTasksCount >= 1
    },
    {
      id: 'ach-6',
      title: '👑 Восхождение Монарха',
      description: 'Достичь 5-го уровня развития игрока.',
      rewardTitle: 'Пробуждённый Монарх',
      unlocked: level >= 5
    }
  ];

  // Auto-trigger unlock popup when a new achievement condition is met
  useEffect(() => {
    ACHIEVEMENTS.forEach(ach => {
      if (ach.unlocked && !unlockedTitles.includes(ach.rewardTitle)) {
        unlockTitle(ach.rewardTitle);
        setUnlockedPopupAchievement(ach);
        sfx.playLevelUp();
      }
    });
  }, [doneTasksCount, doneSTasksCount, dailyStreak, inventory.length, level]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner Header */}
      <div style={{ borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: 'var(--system-blue)', fontFamily: 'var(--font-orbitron)', letterSpacing: '2px', fontWeight: 700 }}>
          ◆ ОТЧЁТ СИСТЕМЫ
        </div>
        <h1 className="font-orbitron text-glow" style={{ fontSize: '28px', color: '#ffffff', letterSpacing: '1px', marginTop: '4px' }}>
          АНАЛИТИКА И ДОСТИЖЕНИЯ
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
          Распределение характеристик, динамика опыта, штрафы и ачивки.
        </div>
      </div>

      {/* Main 2-Column Grid Layout matching Reference Screenshot 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
        
        {/* LEFT COLUMN: Атрибуты / Радарный График (Full Height) */}
        <div className="task-section-card-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--system-blue)', fontWeight: 600 }}>А Т Р И Б У Т Ы</div>
            <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '18px', marginTop: '2px' }}>ПЯТЬ ОСЕЙ РОСТА</h3>
          </div>

          {/* Radar Chart SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1, padding: '10px 0' }}>
            <svg width="260" height="260" viewBox="0 0 240 240" style={{ overflow: 'visible' }}>
              {/* Background Concentric Grid Rings */}
              {[0.25, 0.5, 0.75, 1.0].map((scale, idx) => (
                <polygon
                  key={idx}
                  points={angles.map((_, i) => getPoint(scale * 100, i)).join(' ')}
                  fill="none"
                  stroke="rgba(0, 240, 255, 0.15)"
                  strokeWidth="1"
                />
              ))}

              {/* Axis Spoke Lines */}
              {angles.map((_, i) => (
                <line
                  key={i}
                  x1={cx}
                  y1={cy}
                  x2={cx + r * Math.cos(angles[i])}
                  y2={cy + r * Math.sin(angles[i])}
                  stroke="rgba(0, 240, 255, 0.25)"
                  strokeWidth="1"
                />
              ))}

              {/* Filled Neon Player Radar Polygon */}
              <polygon
                points={pointsString}
                fill="rgba(0, 255, 136, 0.25)"
                stroke="#00ff88"
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 8px #00ff88)' }}
              />

              {/* Axis Labels & Values */}
              <text x={cx} y={cy - r - 12} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="middle">STR ({stats.strength})</text>
              <text x={cx + r + 24} y={cy - 12} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="start">INT ({stats.intelligence})</text>
              <text x={cx + r - 10} y={cy + r + 18} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="start">VIT ({stats.vitality})</text>
              <text x={cx - r + 10} y={cy + r + 18} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="end">GOLD ({stats.goldBonus})</text>
              <text x={cx - r - 24} y={cy - 12} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="end">DISC ({stats.sense})</text>
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid rgba(0, 240, 255, 0.15)' }}>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>STR</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.strength}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>INT</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.intelligence}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>VIT</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.vitality}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>GOLD</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.goldBonus}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>DISC</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.sense}</strong></div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2 Cards (XP Line Chart + Category Donut Chart) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TOP RIGHT CARD: Опыт за 7 дней с Красными Штрафами */}
          <div className="task-section-card-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--system-blue)', fontWeight: 600 }}>ОПЫТ ЗА 7 ДНЕЙ</div>
                <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '16px', marginTop: '2px' }}>ДИНАМИКА НАБОРА XP</h3>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--system-crimson)', border: '1px solid rgba(255, 42, 95, 0.4)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                ● КРАСНЫЕ ТОЧКИ = ШТРАФЫ
              </span>
            </div>

            {/* Bar/Line XP Chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', height: '140px', paddingTop: '20px', borderBottom: '1px solid rgba(0, 240, 255, 0.15)' }}>
              {dailyXpData.map((d, idx) => {
                const heightPct = Math.max(10, Math.round((d.xp / maxXp7Days) * 100));
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexGrow: 1 }}>
                    {d.hasPenalty && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--system-crimson)', boxShadow: '0 0 8px var(--system-crimson)' }} title="Смертельный сброс HP!"></span>
                    )}
                    <span style={{ fontSize: '10px', color: 'var(--system-blue)', fontWeight: 600 }}>{d.xp}</span>
                    <div style={{ width: '100%', maxWidth: '28px', height: `${heightPct}%`, background: d.hasPenalty ? 'rgba(255, 42, 95, 0.6)' : 'linear-gradient(180deg, #00f0ff, rgba(0, 119, 255, 0.3))', borderRadius: '4px 4px 0 0' }}></div>
                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600 }}>{d.dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM RIGHT CARD: Категории за 7 дней */}
          <div className="task-section-card-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--system-blue)', fontWeight: 600 }}>КАТЕГОРИИ ЗА 7 ДНЕЙ</div>
              <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '16px', marginTop: '2px' }}>ДОЛЯ ЗАКРЫТЫХ ЗАДАЧ</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '🏋️ Физика', count: catTotals.physical, color: '#ff2a5f' },
                { label: '💻 Учёба / Работа', count: catTotals.mental, color: '#00f0ff' },
                { label: '🏠 Здоровье / Быт', count: catTotals.spirit, color: '#00ff88' },
                { label: '💰 Финансы', count: catTotals.finance, color: '#ffd700' },
                { label: '🔥 Привычки / Рутина', count: catTotals.discipline, color: '#8a2be2' }
              ].map((c, idx) => {
                const pct = totalClosed7Days > 0 ? Math.round((c.count / totalClosed7Days) * 100) : 0;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.count} квестов ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(5, 12, 30, 0.8)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: c.color, transition: 'width 0.3s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* ACHIEVEMENTS & TITLES SECTION */}
      <div className="task-section-card-container" style={{ borderColor: 'rgba(255, 215, 0, 0.3)' }}>
        <div style={{ borderBottom: '1px solid rgba(255, 215, 0, 0.2)', paddingBottom: '10px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--system-gold)', fontWeight: 700, letterSpacing: '1px' }}>🏆 СИСТЕМА ДОСТИЖЕНИЙ</div>
          <h3 className="font-orbitron text-gold-glow" style={{ color: '#ffffff', fontSize: '18px', marginTop: '2px' }}>ТИТУЛЫ И НАГРАДЫ ИГРОКА</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {ACHIEVEMENTS.map(ach => {
            const isEquipped = activeTitle === ach.rewardTitle;
            return (
              <div
                key={ach.id}
                className="task-item-card"
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  borderColor: ach.unlocked ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255, 255, 255, 0.1)',
                  background: ach.unlocked ? 'rgba(15, 25, 45, 0.9)' : 'rgba(5, 10, 20, 0.5)',
                  opacity: ach.unlocked ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: ach.unlocked ? '#ffffff' : 'var(--text-dim)' }}>
                    {ach.title}
                  </span>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, background: ach.unlocked ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: ach.unlocked ? '#00ff88' : 'var(--text-dim)' }}>
                    {ach.unlocked ? '✓ ОТКРЫТО' : '🔒 ЗАКРЫТО'}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {ach.description}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255, 215, 0, 0.15)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--system-gold)', fontWeight: 600 }}>
                    ТИТУЛ: «{ach.rewardTitle}»
                  </span>

                  {ach.unlocked && (
                    <button
                      onClick={() => equipTitle(ach.rewardTitle)}
                      className={`btn-system ${isEquipped ? 'btn-gold' : ''}`}
                      style={{ fontSize: '10px', padding: '4px 8px' }}
                    >
                      {isEquipped ? '★ ЭКИПИРОВАНО' : 'Экипировать'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* UNLOCKED ACHIEVEMENT POPUP MODAL */}
      <AchievementModal
        achievement={unlockedPopupAchievement}
        onClose={() => setUnlockedPopupAchievement(null)}
        onEquipTitle={(t) => equipTitle(t)}
      />
    </div>
  );
}
