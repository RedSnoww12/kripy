import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  ArcElement,
  Chart as ChartJS,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { useTweenInt } from '@/hooks/useTween';
import { useSettingsStore } from '@/store/useSettingsStore';

ChartJS.register(ArcElement, Tooltip);

interface Props {
  consumed: number;
  target: number;
}

export default function CalorieRing({ consumed, target }: Props) {
  const theme = useSettingsStore((s) => s.theme);

  const remaining = Math.max(0, Math.round(target - consumed));
  const valueRef = useTweenInt<HTMLDivElement>(remaining, 520);

  const { chartData, chartOptions, overTarget } = useMemo(() => {
    const pct = target
      ? Math.min(100, Math.round((consumed / target) * 100))
      : 0;
    const over = consumed > target;

    const ringBg = theme === 'light' ? '#DFE2EA' : '#1F1F24';
    const ringFg = over
      ? '#FF6B6B'
      : pct > 85
        ? '#FFB347'
        : theme === 'light'
          ? '#2DB77B'
          : '#6AEFAF';

    const data = over ? [100, 0] : [pct, 100 - pct];

    const options: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '88%',
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
      },
      animation: { duration: 700, easing: 'easeOutCubic' },
      events: [],
    };

    return {
      overTarget: over,
      chartData: {
        datasets: [
          {
            data,
            backgroundColor: [ringFg, ringBg],
            borderWidth: 0,
            borderRadius: 999,
          },
        ],
      },
      chartOptions: options,
    };
  }, [consumed, target, theme]);

  return (
    <section className="cal-hero">
      <div className="cal-ring">
        <Doughnut data={chartData} options={chartOptions} />
        <div className="cal-ctr">
          <div
            ref={valueRef}
            className="cv"
            style={{ color: overTarget ? 'var(--red)' : 'var(--t1)' }}
          >
            {remaining}
          </div>
          <div className="cl">Restantes (kcal)</div>
          <div className="cs">
            {Math.round(consumed)} / {target} kcal
          </div>
        </div>
      </div>
    </section>
  );
}
