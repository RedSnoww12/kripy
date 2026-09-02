import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MONO_FONT } from '@/features/analysis/charts/chartDefaults';
import type { AxisRead, TrainingStatus } from '@/features/sport/trainingStatus';
import type { LoadWindow } from '@/features/sport/weeklyLoad';
import { formatShortDate } from '@/lib/date';

interface Props {
  windows: LoadWindow[];
  status: TrainingStatus;
}

type Metric = 'sets' | 'tonnage' | 'reps' | 'rpe';
type View = 'chart' | 'table';

interface ChartRow {
  key: string;
  label: string;
  value: number | null;
  win: LoadWindow;
}

const METRIC_LABEL: Record<Metric, string> = {
  sets: 'Séries',
  tonnage: 'Tonnage',
  reps: 'Reps',
  rpe: 'RPE',
};

const METRIC_UNIT: Record<Metric, string> = {
  sets: 'séries',
  tonnage: 'kg',
  reps: 'reps',
  rpe: 'RPE moyen',
};

const CHART_H = 150;
const BAR_W = 18;

function fmt(n: number): string {
  return n.toLocaleString('fr-FR');
}

function fmtRpe(n: number | null): string {
  return n === null ? '—' : n.toFixed(1).replace('.', ',');
}

function metricValue(win: LoadWindow, metric: Metric): number | null {
  if (metric === 'rpe') return win.avgRpe;
  if (win.sessions === 0) return 0;
  return win[metric];
}

function LoadTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload: ChartRow }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const { win } = payload[0].payload;
  return (
    <div className="kl-load-tip">
      <div className="kl-load-tip-range">
        {formatShortDate(win.start)} → {formatShortDate(win.end)}
        {win.index === 0 && ' · 7 derniers jours'}
      </div>
      {win.sessions === 0 ? (
        <div className="kl-load-tip-row">Aucune séance</div>
      ) : (
        <>
          <div className="kl-load-tip-row">
            <span>
              {win.sessions} séance{win.sessions > 1 ? 's' : ''}
            </span>
            <span>{win.sets} séries</span>
          </div>
          <div className="kl-load-tip-row">
            <span>
              {win.tonnage > 0 ? `${fmt(win.tonnage)} kg` : `${win.reps} reps`}
            </span>
            <span>RPE {fmtRpe(win.avgRpe)}</span>
          </div>
          {win.prCount > 0 && (
            <div className="kl-load-tip-row kl-load-tip-pr">
              {win.prCount} record{win.prCount > 1 ? 's' : ''}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function KpiTile({ axis }: { axis: AxisRead }) {
  const dir =
    axis.delta === null || axis.delta === 0
      ? 'flat'
      : axis.delta > 0
        ? 'up'
        : 'down';
  return (
    <div className={`kl-kpi tone-${axis.tone}`}>
      <div className="kl-kpi-lbl">
        <span className="kl-kpi-led" aria-hidden />
        {axis.label.toUpperCase()}
      </div>
      <div className="kl-kpi-val">
        {axis.value}
        <span className="kl-kpi-unit">{axis.unit}</span>
      </div>
      <div className="kl-kpi-foot">
        {axis.deltaLabel !== null && (
          <span className={`kl-kpi-delta dir-${dir}`}>
            {dir !== 'flat' && (
              <span className="material-symbols-outlined" aria-hidden>
                {dir === 'up' ? 'north_east' : 'south_east'}
              </span>
            )}
            {axis.deltaLabel}
          </span>
        )}
        <span className="kl-kpi-hint">{axis.hint}</span>
      </div>
    </div>
  );
}

export default function TrainingLoadCard({ windows, status }: Props) {
  const hasTonnage = windows.some((w) => w.tonnage > 0);
  const hasRpe = windows.some((w) => w.avgRpe !== null);
  const [metric, setMetric] = useState<Metric>('sets');
  const [view, setView] = useState<View>('chart');

  const metrics: Metric[] = useMemo(() => {
    const list: Metric[] = ['sets', hasTonnage ? 'tonnage' : 'reps'];
    if (hasRpe) list.push('rpe');
    return list;
  }, [hasTonnage, hasRpe]);

  const active: Metric = metrics.includes(metric) ? metric : 'sets';

  const rows = useMemo<ChartRow[]>(
    () =>
      windows.map((win) => ({
        key: win.end,
        label: win.index === 0 ? 'auj.' : formatShortDate(win.end),
        value: metricValue(win, active),
        win,
      })),
    [windows, active],
  );

  const totalSessions = windows.reduce((s, w) => s + w.sessions, 0);
  const activeWeeks = windows.filter((w) => w.sessions > 0).length;

  return (
    <section className="kl-load">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        CHARGE · {windows.length} SEMAINES
        <span className="kl-load-meta">
          {activeWeeks}/{windows.length} sem. actives
        </span>
        <button
          type="button"
          className="kl-load-view"
          onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
          aria-label={
            view === 'chart' ? 'Afficher le tableau' : 'Afficher le graphique'
          }
          aria-pressed={view === 'table'}
        >
          <span className="material-symbols-outlined" aria-hidden>
            {view === 'chart' ? 'table_rows' : 'bar_chart'}
          </span>
        </button>
      </div>

      <div className="kl-load-kpis">
        {status.axes.map((axis) => (
          <KpiTile key={axis.key} axis={axis} />
        ))}
      </div>

      {totalSessions === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Enregistre une séance pour suivre ton volume et ton intensité
          semaine après semaine
        </div>
      ) : (
        <>
          <div className="kl-load-tabs" role="tablist">
            {metrics.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={active === m}
                className={`kl-load-tab ${active === m ? 'on' : ''}`}
                onClick={() => setMetric(m)}
              >
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>

          {view === 'chart' ? (
            <>
              <div className="kl-load-chart">
                <ResponsiveContainer width="100%" height={CHART_H}>
                  <BarChart
                    data={rows}
                    margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--s3)"
                      strokeWidth={1}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ ...MONO_FONT, fill: 'var(--t3)' }}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      height={18}
                      tickMargin={6}
                    />
                    <YAxis
                      tick={{ ...MONO_FONT, fill: 'var(--t3)' }}
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      domain={active === 'rpe' ? [6, 10] : [0, 'auto']}
                      allowDecimals={active === 'rpe'}
                      tickFormatter={(v: number) =>
                        active === 'tonnage' && v >= 1000
                          ? `${Math.round(v / 100) / 10}k`
                          : String(v)
                      }
                    />
                    <Tooltip
                      content={<LoadTooltip />}
                      cursor={{ fill: 'var(--s2)' }}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Bar
                      dataKey="value"
                      barSize={BAR_W}
                      radius={[4, 4, 0, 0]}
                      isAnimationActive={false}
                      minPointSize={active === 'rpe' ? 0 : 2}
                    >
                      {rows.map((r) => (
                        <Cell
                          key={r.key}
                          fill={
                            r.win.index === 0
                              ? 'var(--acc)'
                              : 'color-mix(in srgb, var(--acc) 38%, transparent)'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="kl-load-caption">
                Chaque barre = 7 jours glissants · la dernière = les 7 derniers
                jours · {METRIC_UNIT[active]}
              </div>
            </>
          ) : (
            <div className="kl-load-table-wrap">
              <table className="kl-load-table">
                <thead>
                  <tr>
                    <th>Fenêtre</th>
                    <th>Séances</th>
                    <th>Séries</th>
                    <th>{hasTonnage ? 'Tonnage' : 'Reps'}</th>
                    <th>RPE</th>
                    <th>PR</th>
                  </tr>
                </thead>
                <tbody>
                  {[...windows].reverse().map((w) => (
                    <tr key={w.end} className={w.index === 0 ? 'current' : ''}>
                      <td>
                        {formatShortDate(w.start)}→{formatShortDate(w.end)}
                      </td>
                      <td>{w.sessions}</td>
                      <td>{w.sets}</td>
                      <td>{hasTonnage ? fmt(w.tonnage) : w.reps}</td>
                      <td>{fmtRpe(w.avgRpe)}</td>
                      <td>{w.prCount > 0 ? w.prCount : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
