import { useEffect, useMemo, useRef } from 'react';
import WelcomeHeader from '@/components/home/WelcomeHeader';
import StreakBar from '@/components/home/StreakBar';
import CalorieRing from '@/components/home/CalorieRing';
import MacroRow from '@/components/home/MacroRow';
import WaterTracker from '@/components/home/WaterTracker';
import StepsCard from '@/components/home/StepsCard';
import WeightCard from '@/components/home/WeightCard';
import TodayMealsSummary from '@/components/home/TodayMealsSummary';
import RecommendationAlert from '@/components/home/RecommendationAlert';
import AnalysisCard from '@/components/home/AnalysisCard';
import GettingStartedCard from '@/components/home/GettingStartedCard';
import { computeStreak, dayTotals } from '@/features/nutrition/totals';
import { buildHomeAnalysis } from '@/features/analysis/home-analysis';
import { weightStats } from '@/features/analysis/trend';
import { todayISO } from '@/lib/date';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { usePalierStore } from '@/store/usePalierStore';

export default function HomePage() {
  const today = todayISO();

  const targets = useSettingsStore((s) => s.targets);
  const phase = useSettingsStore((s) => s.phase);
  const height = useSettingsStore((s) => s.height);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const stepsGoal = useSettingsStore((s) => s.stepsGoal);

  const log = useNutritionStore((s) => s.log);
  const weights = useTrackingStore((s) => s.weights);
  const steps = useTrackingStore((s) => s.steps[today] ?? 0);

  const palier = usePalierStore((s) => s.palier);
  const recomputePalier = usePalierStore((s) => s.recompute);

  useEffect(() => {
    recomputePalier(targets.kcal, phase, weights);
  }, [targets.kcal, phase, weights, recomputePalier]);

  const totals = useMemo(() => dayTotals(log, today), [log, today]);
  const todayEntries = log[today] ?? [];
  const streak = useMemo(() => computeStreak(log, today), [log, today]);

  const weightRef = useRef<HTMLDivElement>(null);
  const isFresh = weights.length === 0 && todayEntries.length === 0;

  const focusWeightInput = () => {
    const el = weightRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = el.querySelector<HTMLInputElement>('input');
    input?.focus({ preventScroll: true });
  };

  const analysis = useMemo(() => {
    if (!palier) return null;
    return buildHomeAnalysis({
      weights,
      log,
      targets,
      phase,
      palier,
      today,
    });
  }, [weights, log, targets, phase, palier, today]);

  const stats = useMemo(
    () => weightStats({ weights, heightCm: height, startWeight, today }),
    [weights, height, startWeight, today],
  );

  return (
    <div className="tp active">
      <WelcomeHeader />
      {isFresh && <GettingStartedCard onWeighIn={focusWeightInput} />}
      <StreakBar streak={streak} />
      <CalorieRing consumed={totals.kcal} target={targets.kcal} />
      <MacroRow totals={totals} targets={targets} />

      <section className="bento-row">
        <WaterTracker date={today} />
        <StepsCard steps={steps} goal={stepsGoal} />
      </section>

      <div ref={weightRef}>
        <WeightCard />
      </div>

      {analysis?.trend && analysis.recommendation && (
        <RecommendationAlert
          trend={analysis.trend}
          recommendation={analysis.recommendation}
        />
      )}

      {analysis && <AnalysisCard analysis={analysis} stats={stats} />}

      <TodayMealsSummary entries={todayEntries} />
    </div>
  );
}
