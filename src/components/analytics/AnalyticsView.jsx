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
  ArcElement,
  Title
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
  ArcElement,
  Title
);

export function AnalyticsView() {
  const { stats, analyticsLogs, systemEvents } = usePlayerStore();

  // 1. Radar Chart Data (5 Attribute Axes)
  const radarData = {
    labels: ['STR (Сила)', 'INT (Интеллект)', 'VIT (Выносливость)', 'GOLD (Финансы)', 'SEN (Восприятие)'],
    datasets: [
      {
        label: 'Характеристики Персонажа',
        data: [stats.strength, stats.intelligence, stats.vitality, stats.goldBonus, stats.sense],
        backgroundColor: 'rgba(0, 240, 255, 0.25)',
        borderColor: '#00f0ff',
        borderWidth: 2,
        pointBackgroundColor: '#ffd700',
        pointBorderColor: '#fff',
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(0, 240, 255, 0.2)' },
        grid: { color: 'rgba(0, 240, 255, 0.2)' },
        pointLabels: { color: '#e2f1ff', font: { family: 'Inter', size: 12, weight: 'bold' } },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 2. Line Chart Data (XP over time)
  const last7Logs = analyticsLogs.slice(-7);
  const lineLabels = last7Logs.length > 0 ? last7Logs.map(l => l.date) : ['Сегодня'];
  const lineDataPoints = last7Logs.length > 0 ? last7Logs.map(l => l.xpGained) : [0];

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Заработанный XP в день',
        data: lineDataPoints,
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.1)',
        fill: true,
        tension: 0.3
      }
    ]
  };

  // 3. Category Share Donut Chart
  const categoryTotals = { physical: 0, mental: 0, spirit: 0, finance: 0, discipline: 0 };
  analyticsLogs.forEach(log => {
    if (log.categoryBreakdown) {
      Object.keys(log.categoryBreakdown).forEach(cat => {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + log.categoryBreakdown[cat];
      });
    }
  });

  const donutData = {
    labels: ['Физика (STR)', 'Учёба/Работа (INT)', 'Здоровье (VIT)', 'Финансы (GOLD)', 'Привычки (SEN)'],
    datasets: [
      {
        data: [
          categoryTotals.physical || 1,
          categoryTotals.mental || 1,
          categoryTotals.spirit || 1,
          categoryTotals.finance || 1,
          categoryTotals.discipline || 1
        ],
        backgroundColor: ['#00ff88', '#00f0ff', '#8a2be2', '#ffd700', '#ff2a5f'],
        borderWidth: 1,
        borderColor: '#050a15'
      }
    ]
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      {/* Radar Chart */}
      <div className="daily-quest-panel">
        <h3 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '15px' }}>РАДАР ХАРАКТЕРИСТИК (RADAR CHART)</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '14px', position: 'relative' }}>
          <Radar data={radarData} options={radarOptions} />
        </div>
      </div>

      {/* Donut Chart */}
      <div className="daily-quest-panel">
        <h3 className="font-system text-glow" style={{ color: 'var(--system-gold)', fontSize: '15px' }}>ДОЛЯ КАТЕГОРИЙ ЗАДАЧ (DONUT CHART)</h3>
        <div style={{ height: '300px', width: '100%', marginTop: '14px', position: 'relative' }}>
          <Doughnut data={donutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2f1ff', font: { family: 'Inter' } } } } }} />
        </div>
      </div>

      {/* Line Chart */}
      <div className="daily-quest-panel" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="font-system text-glow" style={{ color: 'var(--system-blue)', fontSize: '15px' }}>ДИНАМИКА НАБОРA ОПЫТА (XP) И СОБЫТИЯ СИСТЕМЫ</h3>
          {systemEvents.length > 0 && (
            <span style={{ color: 'var(--system-crimson)', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 700 }}>
              Зафиксировано штрафов (Deaths): {systemEvents.length}
            </span>
          )}
        </div>
        <div style={{ height: '280px', marginTop: '14px', position: 'relative' }}>
          <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e2f1ff', font: { family: 'Inter' } } } } }} />
        </div>
      </div>
    </div>
  );
}
