import { useEffect, useMemo, useRef } from 'react';
import WelcomeHeader from '@/components/home/WelcomeHeader';
import CalorieRing from '@/components/home/CalorieRing';
import MacroRow from '@/components/home/MacroRow';
import WaterTracker from '@/components/home/WaterTracker';
import StepsCard from '@/components/home/StepsCard';
import WeightCard from '@/components/home/WeightCard';
import TodayMealsSummary from '@/components/home/TodayMealsSummary';
import AnalysisCard from '@/components/home/AnalysisCard';
import PhaseAdvisorCard from '@/components/home/PhaseAdvisorCard';
import GettingStartedCard from '@/components/home/GettingStartedCard';
import { computeStreak, dayTotals } from '@/features/nutrition/totals';
import { buildHomeAnalysis } from '@/features/analysis/home-analysis';
import { weightStats } from '@/features/analysis/trend';
import { computeBmr } from '@/features/settings/tdeeCalc';
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
  const sex = useSettingsStore((s) => s.sex);
  const age = useSettingsStore((s) => s.age);
  const goalWeight = useSettingsStore((s) => s.goalWeight);

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
  const hasWeight = weights.length > 0;
  const hasMeal = useMemo(
    () => Object.values(log).some((arr) => arr && arr.length > 0),
    [log],
  );
  const showGettingStarted = !(hasWeight && hasMeal);

  const focusWeightInput = () => {
    const el = weightRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = el.querySelector<HTMLInputElement>('input');
    input?.focus({ preventScroll: true });
  };

  const analysis = useMemo(() => {
    if (!palier) return null;
    const currentWeight = weights.length
      ? weights[weights.length - 1].w
      : startWeight;
    const bmr = computeBmr(currentWeight, height, sex, age);
    return buildHomeAnalysis({
      weights,
      log,
      targets,
      phase,
      palier,
      today,
      bmr,
      goalWeight,
    });
  }, [
    weights,
    log,
    targets,
    phase,
    palier,
    today,
    height,
    startWeight,
    sex,
    age,
    goalWeight,
  ]);

  const stats = useMemo(
    () => weightStats({ weights, heightCm: height, startWeight, today }),
    [weights, height, startWeight, today],
  );

  return (
    <div className="tp active">
      <WelcomeHeader streak={streak} />
      {showGettingStarted && (
        <GettingStartedCard
          onWeighIn={focusWeightInput}
          hasWeight={hasWeight}
          hasMeal={hasMeal}
        />
      )}
      <CalorieRing consumed={totals.kcal} target={targets.kcal} />
      <MacroRow totals={totals} targets={targets} />

      <section className="kl-bento-row">
        <WaterTracker date={today} />
        <StepsCard steps={steps} goal={stepsGoal} />
      </section>

      <div ref={weightRef}>
        <WeightCard />
      </div>

      {analysis?.phaseAdvice && (
        <PhaseAdvisorCard advice={analysis.phaseAdvice} />
      )}
      {analysis && <AnalysisCard analysis={analysis} stats={stats} />}

      <TodayMealsSummary entries={todayEntries} />
    </div>
  );
}
