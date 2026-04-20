import { useMemo, useState } from 'react';
import WeightStatsGrid from '@/components/stats/WeightStatsGrid';
import WeightChart from '@/components/charts/WeightChart';
import PalierChart from '@/components/charts/PalierChart';
import PhaseChart from '@/components/charts/PhaseChart';
import PhaseComparisonChart from '@/components/charts/PhaseComparisonChart';
import KcalBalanceChart from '@/components/charts/KcalBalanceChart';
import CalorieSummary from '@/components/stats/CalorieSummary';
import MacroDonutChart from '@/components/charts/MacroDonutChart';
import MacroLegend from '@/components/stats/MacroLegend';
import MacroAveragesGrid from '@/components/stats/MacroAveragesGrid';
import ProteinChart from '@/components/charts/ProteinChart';
import WeightAnalysisCard from '@/components/stats/WeightAnalysisCard';
import WeightHistoryTable from '@/components/stats/WeightHistoryTable';
import WeightEditModal from '@/components/stats/WeightEditModal';
import WeightAddModal from '@/components/stats/WeightAddModal';
import RangeSelector from '@/components/charts/RangeSelector';
import {
  WEIGHT_RANGES,
  type WeightRange,
} from '@/features/analysis/charts/weightChartData';
import {
  CALORIE_RANGES,
  buildCalorieBalance,
  type CalorieRange,
} from '@/features/analysis/charts/kcalBalanceData';
import {
  MACRO_RANGES,
  buildMacroDonut,
  type MacroRange,
} from '@/features/analysis/charts/macroAverages';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

export default function StatsPage() {
  const weights = useTrackingStore((s) => s.weights);
  const log = useNutritionStore((s) => s.log);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const targets = useSettingsStore((s) => s.targets);

  const [weightRange, setWeightRange] = useState<WeightRange>(30);
  const [kcalRange, setKcalRange] = useState<CalorieRange>(7);
  const [macroRange, setMacroRange] = useState<MacroRange>(7);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const today = todayISO();

  const kcalData = useMemo(
    () =>
      buildCalorieBalance({
        log,
        weights,
        currentKcal: targets.kcal,
        today,
        range: kcalRange,
      }),
    [log, weights, targets.kcal, today, kcalRange],
  );

  const macroData = useMemo(
    () => buildMacroDonut({ log, today, range: macroRange }),
    [log, today, macroRange],
  );

  return (
    <div className="tp active">
      <section className="stat-head">
        <h1>Stats</h1>
        <p>Biometric data stream · analyse de tendance</p>
      </section>

      <WeightStatsGrid onAdd={() => setAddOpen(true)} />

      <section className="stat-card stat-card-big">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>Poids global</h3>
            <p>Weight projection · EMA · objectif</p>
          </div>
          <RangeSelector
            options={WEIGHT_RANGES}
            value={weightRange}
            onChange={setWeightRange}
          />
        </div>
        <div className="stat-chart-wrap" style={{ height: 240 }}>
          <WeightChart
            weights={weights}
            range={weightRange}
            goalWeight={startWeight}
          />
        </div>
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>
              <span
                className="stat-dot"
                style={{ background: 'var(--cyan)' }}
              />
              Tendance palier
            </h3>
          </div>
        </div>
        <PalierChart />
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>
              <span className="stat-dot" style={{ background: 'var(--yel)' }} />
              Tendance phase
            </h3>
          </div>
        </div>
        <PhaseChart />
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>
              <span className="stat-dot" style={{ background: 'var(--pur)' }} />
              Comparaison phases
            </h3>
            <p>Superposition des segments · delta depuis J0</p>
          </div>
        </div>
        <PhaseComparisonChart />
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>
              <span className="stat-dot" style={{ background: 'var(--org)' }} />
              Bilan calorique
            </h3>
            <p>Target vs réel kcal</p>
          </div>
          <RangeSelector
            options={CALORIE_RANGES}
            value={kcalRange}
            onChange={setKcalRange}
          />
        </div>
        <div className="stat-chart-wrap" style={{ height: 180 }}>
          <KcalBalanceChart range={kcalRange} />
        </div>
        <CalorieSummary summary={kcalData.summary} />
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>Répartition macros</h3>
            <p>Moyenne sur la fenêtre</p>
          </div>
          <RangeSelector
            options={MACRO_RANGES}
            value={macroRange}
            onChange={setMacroRange}
          />
        </div>
        <div className="stat-macros-body">
          <div className="stat-donut-wrap" style={{ height: 160, width: 160 }}>
            <MacroDonutChart range={macroRange} />
          </div>
          <MacroLegend averages={macroData.averages} />
        </div>
        <MacroAveragesGrid
          averages={macroData.averages}
          targetProtein={targets.prot}
        />
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>
              <span className="stat-dot" style={{ background: 'var(--grn)' }} />
              Protéines
            </h3>
            <p>7 derniers jours</p>
          </div>
        </div>
        <div className="stat-chart-wrap" style={{ height: 180 }}>
          <ProteinChart />
        </div>
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>
              <span className="stat-dot" style={{ background: 'var(--pnk)' }} />
              Analyse poids
            </h3>
            <p>Trend 72 jours</p>
          </div>
        </div>
        <WeightAnalysisCard />
      </section>

      <section className="stat-card">
        <div className="stat-card-head">
          <div className="stat-card-title">
            <h3>Journal des pesées</h3>
            <p>Weight history log</p>
          </div>
          <button
            type="button"
            className="stat-export-btn"
            onClick={() => setAddOpen(true)}
          >
            <span className="material-symbols-outlined">add</span>
            Ajouter
          </button>
        </div>
        <div className="stat-wh">
          <div className="stat-wh-head">
            <span>Date</span>
            <span>Phase</span>
            <span>Poids</span>
            <span className="right">Tendance</span>
          </div>
          <WeightHistoryTable onEdit={setEditDate} />
        </div>
      </section>

      <WeightEditModal
        open={editDate !== null}
        date={editDate}
        onClose={() => setEditDate(null)}
      />
      <WeightAddModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
