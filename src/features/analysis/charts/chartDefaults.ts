import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  DoughnutController,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';

let registered = false;

export function ensureChartJsRegistered(): void {
  if (registered) return;
  ChartJS.register(
    ArcElement,
    BarController,
    BarElement,
    CategoryScale,
    DoughnutController,
    Filler,
    LineController,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
  );
  registered = true;
}

export const CHART_COLORS = {
  primary: '#6AEFAF',
  cyan: '#4DD0E1',
  pink: '#FF6B9D',
  orange: '#FFB347',
  yellow: '#FFD93D',
  purple: '#9F9BFF',
  red: '#FF6B6B',
  tickMute: '#5A5E6B',
  legendMute: '#9AA0AB',
  gridMute: 'rgba(42, 43, 49, .5)',
} as const;

export const MONO_FONT = {
  family: 'JetBrains Mono',
  size: 8,
} as const;

export const MACRO_COLORS = {
  p: CHART_COLORS.primary,
  g: CHART_COLORS.cyan,
  l: CHART_COLORS.pink,
  f: CHART_COLORS.orange,
} as const;

export function baseLineOptions(
  overrides?: Partial<ChartOptions<'line'>>,
): ChartOptions<'line'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        ticks: {
          color: CHART_COLORS.tickMute,
          font: MONO_FONT,
          maxTicksLimit: 7,
        },
        grid: { color: CHART_COLORS.gridMute },
      },
      y: {
        ticks: { color: CHART_COLORS.tickMute, font: MONO_FONT },
        grid: { color: CHART_COLORS.gridMute },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}`,
        },
      },
    },
    ...overrides,
  };
}

export function baseBarOptions(
  overrides?: Partial<ChartOptions<'bar'>>,
): ChartOptions<'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: CHART_COLORS.tickMute, font: MONO_FONT },
        grid: { display: false },
      },
      y: {
        ticks: { color: CHART_COLORS.tickMute, font: MONO_FONT },
        grid: { color: CHART_COLORS.gridMute },
      },
    },
    plugins: {
      legend: { display: false },
    },
    ...overrides,
  };
}

export function baseDoughnutOptions(
  overrides?: Partial<ChartOptions<'doughnut'>>,
): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: { legend: { display: false } },
    ...overrides,
  };
}
