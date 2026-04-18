import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { cloudSave } from '@/features/auth/cloudSync';
import { DEFAULT_PROFILE } from '@/data/constants';
import { deriveActivity } from '@/features/settings/activityFromInputs';
import type { Phase } from '@/types';
import BootScreen from '@/components/onboarding/steps/BootScreen';
import NameAgeScreen from '@/components/onboarding/steps/NameAgeScreen';
import WeightScreen from '@/components/onboarding/steps/WeightScreen';
import HeightScreen from '@/components/onboarding/steps/HeightScreen';
import ActivityScreen from '@/components/onboarding/steps/ActivityScreen';
import PhaseScreen from '@/components/onboarding/steps/PhaseScreen';
import TargetScreen from '@/components/onboarding/steps/TargetScreen';
import CalibrateScreen from '@/components/onboarding/steps/CalibrateScreen';
import type { CalibrationResult } from '@/features/settings/calibration';
import ReadyScreen from '@/components/onboarding/steps/ReadyScreen';

const ONB_STEPS = [
  'boot',
  'name',
  'weight',
  'height',
  'activity',
  'phase',
  'target',
  'calibrate',
  'ready',
] as const;
type StepKey = (typeof ONB_STEPS)[number];

interface OnbData {
  name: string;
  age: number;
  weight: number;
  height: number;
  steps: number;
  sport: number;
  phase: Phase;
  targetWeight: number;
}

const INITIAL_DATA: OnbData = {
  name: '',
  age: 28,
  weight: 75.0,
  height: 178,
  steps: 8000,
  sport: 3,
  phase: DEFAULT_PROFILE.phase,
  targetWeight: 75.0,
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const setExtras = useSettingsStore((s) => s.setExtras);
  const confirmTdee = useSettingsStore((s) => s.confirmTdee);
  const user = useSessionStore((s) => s.user);

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<OnbData>(INITIAL_DATA);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(
    null,
  );

  const total = ONB_STEPS.length;
  const stepKey: StepKey = ONB_STEPS[stepIdx];
  const next = () => setStepIdx((i) => Math.min(total - 1, i + 1));
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  const patch = useCallback(<K extends keyof OnbData>(k: K, v: OnbData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  const finalize = useCallback(async () => {
    if (!calibration) return;
    const activity = deriveActivity(data.steps, data.sport);
    const targets = {
      kcal: calibration.kcal,
      prot: calibration.prot,
      gluc: calibration.gluc,
      lip: calibration.lip,
      fib: calibration.fib,
    };
    completeOnboarding(
      {
        height: data.height,
        startWeight: data.weight,
        phase: data.phase,
        stepsGoal: data.steps,
        activity,
        theme: DEFAULT_PROFILE.theme,
      },
      targets,
    );
    setExtras({
      name: data.name.trim(),
      age: data.age,
      goalWeight: data.targetWeight,
      sportSessions: data.sport,
    });
    confirmTdee();

    if (user) {
      try {
        await cloudSave(user);
      } catch (e) {
        console.warn('cloudSave after onboarding failed', e);
      }
    }

    navigate('/', { replace: true });
  }, [
    calibration,
    completeOnboarding,
    confirmTdee,
    data,
    navigate,
    setExtras,
    user,
  ]);

  let body: React.ReactNode;
  switch (stepKey) {
    case 'boot':
      body = <BootScreen onDone={next} />;
      break;
    case 'name':
      body = (
        <NameAgeScreen
          step={stepIdx}
          total={total}
          name={data.name}
          setName={(v) => patch('name', v)}
          age={data.age}
          setAge={(v) => patch('age', v)}
          onNext={next}
          onBack={back}
        />
      );
      break;
    case 'weight':
      body = (
        <WeightScreen
          step={stepIdx}
          total={total}
          value={data.weight}
          setValue={(v) =>
            setData((d) => ({
              ...d,
              weight: v,
              targetWeight:
                Math.abs(d.targetWeight - d.weight) < 0.01 ? v : d.targetWeight,
            }))
          }
          onNext={next}
          onBack={back}
        />
      );
      break;
    case 'height':
      body = (
        <HeightScreen
          step={stepIdx}
          total={total}
          value={data.height}
          setValue={(v) => patch('height', v)}
          onNext={next}
          onBack={back}
        />
      );
      break;
    case 'activity':
      body = (
        <ActivityScreen
          step={stepIdx}
          total={total}
          steps={data.steps}
          setSteps={(v) => patch('steps', v)}
          sport={data.sport}
          setSport={(v) => patch('sport', v)}
          onNext={next}
          onBack={back}
        />
      );
      break;
    case 'phase':
      body = (
        <PhaseScreen
          step={stepIdx}
          total={total}
          value={data.phase}
          setValue={(v) => patch('phase', v)}
          onNext={next}
          onBack={back}
        />
      );
      break;
    case 'target':
      body = (
        <TargetScreen
          step={stepIdx}
          total={total}
          value={data.targetWeight}
          setValue={(v) => patch('targetWeight', v)}
          currentWeight={data.weight}
          phase={data.phase}
          onNext={next}
          onBack={back}
        />
      );
      break;
    case 'calibrate':
      body = (
        <CalibrateScreen
          step={stepIdx}
          total={total}
          data={data}
          onNext={(result) => {
            setCalibration(result);
            next();
          }}
          onBack={back}
        />
      );
      break;
    case 'ready':
      body = (
        <ReadyScreen
          name={data.name}
          phase={data.phase}
          kcal={calibration?.kcal ?? 0}
          targetWeight={data.targetWeight}
          onNext={() => {
            void finalize();
          }}
        />
      );
      break;
  }

  return (
    <div className="onb-root">
      <div key={stepKey} className="onb-screen">
        {body}
      </div>
    </div>
  );
}
