import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { computeTdee } from '@/features/settings/tdeeCalc';
import { toast } from '@/components/ui/toastStore';
import { PHASE_NAMES } from '@/data/constants';
import type {
  AdvisorOption,
  PhaseAdvice,
} from '@/features/analysis/phaseAdvisor';
import type { Phase, Targets } from '@/types';

const TONE_COLOR: Record<PhaseAdvice['tone'], string> = {
  info: 'var(--cyan)',
  success: 'var(--acc)',
  warn: 'var(--org)',
  danger: 'var(--red)',
};

const TONE_BG: Record<PhaseAdvice['tone'], string> = {
  info: 'var(--cyanG)',
  success: 'var(--accG)',
  warn: 'var(--orgG)',
  danger: 'var(--redG)',
};

const TONE_ICON: Record<PhaseAdvice['tone'], string> = {
  info: 'lightbulb',
  success: 'check_circle',
  warn: 'warning',
  danger: 'priority_high',
};

interface Props {
  advice: PhaseAdvice;
}

export default function PhaseAdvisorCard({ advice }: Props) {
  const phase = useSettingsStore((s) => s.phase);
  const setPhase = useSettingsStore((s) => s.setPhase);
  const setTargets = useSettingsStore((s) => s.setTargets);
  const targets = useSettingsStore((s) => s.targets);
  const height = useSettingsStore((s) => s.height);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const stepsGoal = useSettingsStore((s) => s.stepsGoal);
  const activity = useSettingsStore((s) => s.activity);
  const sex = useSettingsStore((s) => s.sex);
  const age = useSettingsStore((s) => s.age);
  const weights = useTrackingStore((s) => s.weights);

  const apply = (option: AdvisorOption) => {
    if (option.action === 'wait') {
      toast("Continue d'observer le palier", 'info');
      return;
    }

    if (option.action === 'push_palier') {
      const delta = option.kcalDelta ?? 200;
      const glucDelta = Math.round(delta / 4);
      const nextGluc = Math.max(0, targets.gluc + glucDelta);
      const nextKcal = targets.prot * 4 + nextGluc * 4 + targets.lip * 9;
      const nextTargets: Targets = {
        ...targets,
        gluc: nextGluc,
        kcal: nextKcal,
      };
      setTargets(nextTargets);
      toast(
        `Palier suivant · ${delta > 0 ? '+' : ''}${delta} kcal → ${nextKcal} kcal`,
        'success',
      );
      return;
    }

    if (!option.targetPhase || option.targetPhase === phase) return;
    const currentWeight = weights.length
      ? weights[weights.length - 1].w
      : startWeight;
    const next = computeTdee({
      weight: currentWeight,
      heightCm: height,
      stepsGoal,
      activity,
      phase: option.targetPhase as Phase,
      sex,
      age,
    });
    setPhase(option.targetPhase as Phase);
    setTargets(next.targets);
    toast(
      `Phase ${PHASE_NAMES[option.targetPhase as Phase]} · ${next.tdee} kcal`,
      'success',
    );
  };

  const color = TONE_COLOR[advice.tone];
  const bg = TONE_BG[advice.tone];
  const icon = TONE_ICON[advice.tone];

  return (
    <section
      className="kl-advisor"
      style={{
        background: `color-mix(in srgb, ${color} 6%, var(--s1))`,
        borderRadius: 18,
        padding: '14px 16px',
        marginBottom: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: bg,
            color,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
          aria-hidden
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 16, fontWeight: 700 }}
          >
            {icon}
          </span>
        </span>
        <span
          className="kl-analysis-sectlbl"
          style={{ color, letterSpacing: '0.18em' }}
        >
          ▸ COACH MÉTABOLIQUE
        </span>
      </div>

      <div className="kl-analysis-verdict" style={{ fontSize: 17 }}>
        {advice.headline}
      </div>

      <div
        className="kl-analysis-subline"
        style={{ lineHeight: 1.5, fontSize: 12 }}
      >
        {advice.reason}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 6,
          background: 'var(--s2)',
          borderRadius: 10,
          padding: '8px 10px',
        }}
      >
        <Stat label="BMR" value={`${Math.round(advice.bmrRatio * 100)}%`} />
        <Stat label="Δ BMR" value={`+${advice.bmrGapKcal}`} unit="kcal" />
        <Stat label="Paliers" value={String(advice.paliersInPhase)} />
      </div>

      {advice.options.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {advice.options.map((opt) => {
            const optColor = TONE_COLOR[opt.tone];
            return (
              <button
                key={opt.action}
                type="button"
                onClick={() => apply(opt)}
                style={{
                  flex: '1 1 140px',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: `1px solid color-mix(in srgb, ${optColor} 35%, transparent)`,
                  background: `color-mix(in srgb, ${optColor} 10%, transparent)`,
                  color: optColor,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

interface StatProps {
  label: string;
  value: string;
  unit?: string;
}

function Stat({ label, value, unit }: StatProps) {
  return (
    <div>
      <div className="kl-stat-lbl">{label}</div>
      <div className="kl-stat-val" style={{ fontSize: 15 }}>
        {value}
        {unit && (
          <span
            style={{
              fontSize: 10,
              color: 'var(--t3)',
              fontWeight: 400,
              marginLeft: 3,
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
