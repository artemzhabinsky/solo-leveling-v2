import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Radar, Line, Doughnut } from 'react-chartjs-2';
import { usePlayerStore } from '../../store/usePlayerStore.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ArcElement
);

export function AnalyticsView() {
  const { stats, analyticsLogs, systemEvents } = usePlayerStore();

  // 1. Radar Chart Data (5 Axes: STR, INT, VIT, GOLD, DISC)
  const radarData = {
    labels: ['STR', 'INT', 'VIT', 'GOLD', 'DISC'],
    datasets: [
      {
        label: 'Атрибуты',
        data: [stats.strength, stats.intelligence, stats.vitality, stats.goldBonus, stats.sense],
        backgroundColor: 'rgba(0, 255, 136, 0.15)',
        borderColor: '#00ff88',
        borderWidth: 2,
        pointBackgroundColor: '#00ff88',
        pointBorderColor: '#fff',
        pointRadius: 4
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0, 255, 136, 0.15)' },
        grid: { color: 'rgba(0, 255, 136, 0.15)' },
        pointLabels: { color: '#8ab4f8', font: { family: 'Inter', size: 12, weight: 'bold' } },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 2. Line Chart Data (XP over last 7 days + Red Penalty points)
  const daysList = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const shortLabel = dateStr.slice(5); // e.g. "07-22"
    daysList.push({ dateStr, shortLabel });
  }

  const lineLabels = daysList.map(d => d.shortLabel);
  const lineDataPoints = daysList.map(d => {
    const log = analyticsLogs.find(l => l.date === d.dateStr);
    return log ? log.xpGained : 0;
  });

  // Check if death event happened on specific day
  const pointBackgroundColors = daysList.map(d => {
    const hasDeath = systemEvents.some(e => e.occurredAt && e.occurredAt.split('T')[0] === d.dateStr);
    return hasDeath ? '#ff2a5f' : '#00ff88';
  });

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'XP',
        data: lineDataPoints,
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: pointBackgroundColors,
        pointBorderColor: pointBackgroundColors,
        pointRadius: 5
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#5c78a3', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#5c78a3', font: { family: 'Inter', size: 11 } }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 3. Category Donut Chart (Last 7 days share)
  const categoryTotals = { physical: 0, mental: 0, spirit: 0, finance: 0, discipline: 0 };
  analyticsLogs.forEach(log => {
    if (log.categoryBreakdown) {
      Object.keys(log.categoryBreakdown).forEach(cat => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + log.categoryBreakdown[cat];
      });
    }
  });

  const donutData = {
    labels: ['Физика', 'Учёба/Работа', 'Здоровье/Быт', 'Финансы', 'Привычки/Рутина'],
    datasets: [
      {
        data: [
          categoryTotals.physical || 1,
          categoryTotals.mental || 1,
          categoryTotals.spirit || 0,
          categoryTotals.finance || 0,
          categoryTotals.discipline || 0
        ],
        backgroundColor: ['#00ff88', '#ffd700', '#00f0ff', '#8a2be2', '#ff2a5f'],
        borderWidth: 2,
        borderColor: '#050a15'
      }
    ]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2f1ff',
          font: { family: 'Inter', size: 12 },
          boxWidth: 12,
          padding: 16
        }
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner matching Screenshot 3 */}
      <div style={{ borderBottom: '1px solid rgba(0, 255, 136, 0.2)', paddingBottom: '12px' }}>
        <div style={{ fontSize: '11px', color: '#00ff88', fontFamily: 'var(--font-orbitron)', letterSpacing: '2px', fontWeight: 700 }}>
          ◆ ОТЧЁТ СИСТЕМЫ
        </div>
        <h1 className="font-orbitron" style={{ fontSize: '28px', color: '#ffffff', letterSpacing: '1px', marginTop: '4px' }}>
          АНАЛИТИКА
        </h1>
        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
          Куда уходит опыт и какие атрибуты отстают.
        </div>
      </div>

      {/* Grid Layout matching Screenshot 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
        {/* Left Column: Attributes Radar */}
        <div className="task-section-card-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderColor: 'rgba(0, 255, 136, 0.25)' }}>
          <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '18px' }}>Атрибуты</h3>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
            ПЯТЬ ОСЕЙ РОСТА
          </div>
          <div style={{ height: '380px', width: '100%', marginTop: '20px', position: 'relative' }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Right Column: Stacked Line & Donut */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Right: XP for 7 Days */}
          <div className="task-section-card-container" style={{ borderColor: 'rgba(0, 255, 136, 0.25)' }}>
            <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '17px' }}>Опыт за 7 дней</h3>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
              КРАСНЫЕ ТОЧКИ — ШТРАФЫ
            </div>
            <div style={{ height: '180px', width: '100%', marginTop: '12px', position: 'relative' }}>
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>

          {/* Bottom Right: Categories for 7 Days */}
          <div className="task-section-card-container" style={{ borderColor: 'rgba(0, 255, 136, 0.25)' }}>
            <h3 className="font-orbitron" style={{ color: '#ffffff', fontSize: '17px' }}>Категории за 7 дней</h3>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>
              ДОЛЯ ЗАКРЫТЫХ ЗАДАЧ
            </div>
            <div style={{ height: '180px', width: '100%', marginTop: '12px', position: 'relative' }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
