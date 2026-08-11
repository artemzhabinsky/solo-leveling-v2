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
  const [chartMetric, setChartMetric] = useState('xp'); // 'xp' | 'gold'

  // 1. Radar Chart Axes Calculations (Default 0 everywhere if no tasks done)
  const maxAttrVal = Math.max(stats.strength, stats.intelligence, stats.vitality, stats.goldBonus, stats.sense, 1);
  
  const strPct = Math.round(((stats.strength || 0) / maxAttrVal) * 100);
  const intPct = Math.round(((stats.intelligence || 0) / maxAttrVal) * 100);
  const vitPct = Math.round(((stats.vitality || 0) / maxAttrVal) * 100);
  const goldPct = Math.round(((stats.goldBonus || 0) / maxAttrVal) * 100);
  const discPct = Math.round(((stats.sense || 0) / maxAttrVal) * 100);

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

  // 2. 7-Day XP / Gold & Category Stats Calculations
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyHistoryData = last7Days.map(dateStr => {
    const log = analyticsLogs.find(l => l.date === dateStr);
    const dayName = new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'short' });
    const hasPenalty = systemEvents.some(ev => 
      (ev.eventType === 'penalty_reset' || ev.eventType === 'penalty_hp_loss') && 
      ev.occurredAt && ev.occurredAt.startsWith(dateStr)
    );
    return {
      date: dateStr,
      dayName: dayName.toUpperCase(),
      xp: log ? (log.xpGained || 0) : 0,
      gold: log ? (log.goldGained || 0) : 0,
      tasks: log ? (log.tasksCompleted || 0) : 0,
      hasPenalty
    };
  });

  const maxVal7Days = Math.max(
    ...dailyHistoryData.map(d => chartMetric === 'xp' ? d.xp : d.gold),
    chartMetric === 'xp' ? 100 : 20
  );

  // SVG Line Chart Coordinate Math
  const linePoints = dailyHistoryData.map((d, i) => {
    const val = chartMetric === 'xp' ? d.xp : d.gold;
    const x = 30 + i * 56.6;
    const y = 95 - (val / maxVal7Days) * 70;
    return { x, y, val, ...d };
  });

  const polylineStr = linePoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaPolygonStr = `30,105 ${polylineStr} 370,105`;

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
      unlocked: dailyHistoryData.some(d => d.tasks >= 5)
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

  const activeColor = chartMetric === 'xp' ? '#00f0ff' : '#ffd700';

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
          Распределение характеристик, графики набора опыта и монет, штрафы и ачивки.
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
              <text x={cx} y={cy - r - 12} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="middle">STR ({stats.strength || 0})</text>
              <text x={cx + r + 24} y={cy - 12} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="start">INT ({stats.intelligence || 0})</text>
              <text x={cx + r - 10} y={cy + r + 18} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="start">VIT ({stats.vitality || 0})</text>
              <text x={cx - r + 10} y={cy + r + 18} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="end">GOLD ({stats.goldBonus || 0})</text>
              <text x={cx - r - 24} y={cy - 12} fill="#00f0ff" fontSize="11" fontWeight="700" textAnchor="end">DISC ({stats.sense || 0})</text>
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid rgba(0, 240, 255, 0.15)' }}>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>STR</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.strength || 0}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>INT</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.intelligence || 0}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>VIT</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.vitality || 0}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>GOLD</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.goldBonus || 0}</strong></div>
            <div><div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>DISC</div><strong style={{ fontSize: '13px', color: '#00ff88' }}>{stats.sense || 0}</strong></div>
          </div>
        </div>

        {/* RIGHT COLUMN: 2 Cards (XP/Gold Line Chart + Category Donut Chart) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* TOP RIGHT CARD: Опыт / Монеты за 7 дней с переключателем видов */}
          <div className="task-section-card-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: chartMetric === 'xp' ? 'var(--system-blue)' : 'var(--system-gold)', fontWeight: 600, transition: 'color 0.3s ease' }}>
                  {chartMetric === 'xp' ? 'ОПЫТ ЗА 7 ДНЕЙ' : 'МОНЕТЫ ЗА 7 ДНЕЙ'}
                </div>
                <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '16px', marginTop: '2px' }}>
                  {chartMetric === 'xp' ? 'ДИНАМИКА НАБОРА XP' : 'ДИНАМИКА ЗАРАБОТКА МОНЕТ'}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Metric Switcher Buttons */}
                <div style={{ display: 'inline-flex', background: 'rgba(5, 10, 20, 0.8)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', padding: '2px' }}>
                  <button
                    onClick={() => setChartMetric('xp')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: chartMetric === 'xp' ? 'var(--system-blue)' : 'transparent',
                      color: chartMetric === 'xp' ? '#050a15' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    ⚡ Опыт
                  </button>
                  <button
                    onClick={() => setChartMetric('gold')}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: chartMetric === 'gold' ? 'var(--system-gold)' : 'transparent',
                      color: chartMetric === 'gold' ? '#050a15' : 'var(--text-muted)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🪙 Монеты
                  </button>
                </div>

                {chartMetric === 'xp' && (
                  <span style={{ fontSize: '10px', color: 'var(--system-crimson)', border: '1px solid rgba(255, 42, 95, 0.4)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    ● КРАСНЫЕ ТОЧКИ = ШТРАФЫ
                  </span>
                )}
              </div>
            </div>

            {/* Glowing SVG Line Chart */}
            <div style={{ position: 'relative', width: '100%', height: '160px', marginTop: '10px' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="metricAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={activeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                <line x1="20" y1="25" x2="380" y2="25" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
                <line x1="20" y1="60" x2="380" y2="60" stroke="rgba(255, 255, 255, 0.08)" strokeDasharray="3 3" />
                <line x1="20" y1="95" x2="380" y2="95" stroke="rgba(255, 255, 255, 0.12)" />

                {/* Filled Gradient Area */}
                <polygon points={areaPolygonStr} fill="url(#metricAreaGrad)" />

                {/* Main Glowing Metric Line */}
                <polyline points={polylineStr} fill="none" stroke={activeColor} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 6px ${activeColor})` }} />

                {/* Data Points & Values */}
                {linePoints.map((pt, idx) => (
                  <g key={idx}>
                    {/* Value Number Label above node */}
                    <text x={pt.x} y={pt.y - 10} fill={pt.val > 0 ? activeColor : 'var(--text-dim)'} fontSize="11" fontWeight="700" textAnchor="middle">
                      {chartMetric === 'gold' && pt.val > 0 ? `+${pt.val}` : pt.val}
                    </text>

                    {/* Point Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={chartMetric === 'xp' && pt.hasPenalty ? "6" : "4"}
                      fill={chartMetric === 'xp' && pt.hasPenalty ? "#ff2a5f" : activeColor}
                      stroke="#050a15"
                      strokeWidth="2"
                      style={{ filter: (chartMetric === 'xp' && pt.hasPenalty) ? 'drop-shadow(0 0 8px #ff2a5f)' : `drop-shadow(0 0 6px ${activeColor})` }}
                    />

                    {/* Day Label at bottom */}
                    <text x={pt.x} y="115" fill="var(--text-dim)" fontSize="10" fontWeight="600" textAnchor="middle">
                      {pt.dayName}
                    </text>
                  </g>
                ))}
              </svg>
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
