import { useState } from 'react';
import { toast } from '@/components/ui/toastStore';
import {
  activeAdjustments,
  adjustmentDayIndex,
  adjustmentEndDate,
  clampSmoothDays,
  dailyDelta,
  effectiveKcalTarget,
  findBySourceDate,
  MAX_SMOOTH_DAYS,
  MIN_SMOOTH_DAYS,
  MIN_SURPLUS_KCAL,
  SMOOTH_DAY_PRESETS,
} from '@/features/nutrition/budget';
import { dayTotals } from '@/features/nutrition/totals';
import { addDaysISO, formatShortDate } from '@/lib/date';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { BudgetAdjustment } from '@/types';
import styles from './BudgetSmoothPanel.module.css';

const UPDATE_EPS = 10;

interface Props {
  today: string;
  consumedToday: number;
}

export default function BudgetSmoothPanel({ today, consumedToday }: Props) {
  const targets = useSettingsStore((s) => s.targets);
  const log = useNutritionStore((s) => s.log);
  const adjustments = useBudgetStore((s) => s.adjustments);
  const dismissed = useBudgetStore((s) => s.dismissed);
  const smooth = useBudgetStore((s) => s.smooth);
  const cancel = useBudgetStore((s) => s.cancel);
  const dismissProposal = useBudgetStore((s) => s.dismissProposal);

  const yesterday = addDaysISO(today, -1);

  const effToday = effectiveKcalTarget(targets.kcal, adjustments, today);
  const surplusToday = Math.round(consumedToday - effToday);
  const adjToday = findBySourceDate(adjustments, today);

  const trackedYesterday = (log[yesterday] ?? []).length > 0;
  const effYesterday = effectiveKcalTarget(
    targets.kcal,
    adjustments,
    yesterday,
  );
  const surplusYesterday = Math.round(
    dayTotals(log, yesterday).kcal - effYesterday,
  );
  const proposeYesterday =
    trackedYesterday &&
    surplusYesterday >= MIN_SURPLUS_KCAL &&
    !findBySourceDate(adjustments, yesterday) &&
    !dismissed.includes(yesterday);

  const proposeToday =
    !adjToday && surplusToday >= MIN_SURPLUS_KCAL && !dismissed.includes(today);

  const todayNeedsUpdate =
    adjToday !== undefined &&
    surplusToday > 0 &&
    Math.abs(surplusToday - adjToday.amount) >= UPDATE_EPS;

  const todayObsolete = adjToday !== undefined && surplusToday <= 0;

  const active = activeAdjustments(adjustments, today);
  const scheduled = adjToday && !todayObsolete ? [adjToday] : [];

  const hasContent =
    proposeYesterday ||
    proposeToday ||
    todayNeedsUpdate ||
    todayObsolete ||
    active.length > 0 ||
    scheduled.length > 0;

  if (!hasContent) return null;

  const handleSmooth = (sourceDate: string, amount: number, days: number) => {
    smooth(sourceDate, amount, days);
    const perDay = Math.round(amount / days);
    toast(`Surplus lissé : −${perDay} kcal/j pendant ${days} j`, 'success');
  };

  const handleCancel = (adj: BudgetAdjustment) => {
    cancel(adj.id);
    toast('Lissage annulé, budget de base restauré', 'info');
  };

  return (
    <section className={styles.panel}>
      <div className={styles.headLbl}>▸ LISSAGE · BUDGET</div>

      {proposeYesterday && (
        <SmoothProposal
          title={`Surplus d'hier : +${surplusYesterday} kcal`}
          hint="Répartis-le sur les prochains jours, dès aujourd'hui."
          amount={surplusYesterday}
          startsLabel="dès aujourd'hui"
          onConfirm={(days) => handleSmooth(yesterday, surplusYesterday, days)}
          onDismiss={() => dismissProposal(yesterday)}
        />
      )}

      {proposeToday && (
        <SmoothProposal
          title={`Dépassement du jour : +${surplusToday} kcal`}
          hint="Répartis-le sur les prochains jours, ton budget sera réduit automatiquement."
          amount={surplusToday}
          startsLabel="dès demain"
          onConfirm={(days) => handleSmooth(today, surplusToday, days)}
          onDismiss={() => dismissProposal(today)}
        />
      )}

      {todayNeedsUpdate && adjToday && (
        <SmoothProposal
          title={`Le dépassement a évolué : +${surplusToday} kcal`}
          hint={`Lissage actuel : ${adjToday.amount} kcal sur ${adjToday.days} j. Mets-le à jour.`}
          amount={surplusToday}
          startsLabel="dès demain"
          initialDays={adjToday.days}
          confirmLabel="Mettre à jour"
          onConfirm={(days) => handleSmooth(today, surplusToday, days)}
        />
      )}

      {todayObsolete && adjToday && (
        <div className={styles.obsolete}>
          <span className={styles.obsoleteTxt}>
            Plus de dépassement aujourd'hui — le lissage programmé n'est plus
            nécessaire.
          </span>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => handleCancel(adjToday)}
          >
            Annuler
          </button>
        </div>
      )}

      {(active.length > 0 || scheduled.length > 0) && (
        <div className={styles.activeList}>
          {active.map((adj) => (
            <ActiveRow
              key={adj.id}
              line={`−${dailyDelta(adj, today)} kcal/j · J${adjustmentDayIndex(adj, today)}/${adj.days}`}
              sub={`surplus du ${formatShortDate(adj.sourceDate)} · fin ${formatShortDate(adjustmentEndDate(adj))}`}
              onCancel={() => handleCancel(adj)}
            />
          ))}
          {scheduled.map((adj) => (
            <ActiveRow
              key={adj.id}
              scheduled
              line={`−${dailyDelta(adj, adj.startDate)} kcal/j dès demain · ${adj.days} j`}
              sub={`surplus du jour · fin ${formatShortDate(adjustmentEndDate(adj))}`}
              onCancel={() => handleCancel(adj)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface ProposalProps {
  title: string;
  hint: string;
  amount: number;
  startsLabel: string;
  initialDays?: number;
  confirmLabel?: string;
  onConfirm: (days: number) => void;
  onDismiss?: () => void;
}

function SmoothProposal({
  title,
  hint,
  amount,
  startsLabel,
  initialDays = 3,
  confirmLabel = 'Lisser le surplus',
  onConfirm,
  onDismiss,
}: ProposalProps) {
  const [days, setDays] = useState(initialDays);
  const perDay = Math.round(amount / days);

  return (
    <div className={styles.proposal}>
      <div className={styles.proposalHead}>
        <span className={styles.proposalTitle}>{title}</span>
        {onDismiss && (
          <button
            type="button"
            className={styles.dismissBtn}
            aria-label="Ignorer la proposition"
            onClick={onDismiss}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>
      <p className={styles.proposalHint}>{hint}</p>

      <div className={styles.daysRow}>
        {SMOOTH_DAY_PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            className={`${styles.dayChip}${days === d ? ` ${styles.dayChipOn}` : ''}`}
            onClick={() => setDays(d)}
          >
            {d} j
          </button>
        ))}
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Moins de jours"
            disabled={days <= MIN_SMOOTH_DAYS}
            onClick={() => setDays(clampSmoothDays(days - 1))}
          >
            −
          </button>
          <span className={styles.stepVal}>{days}</span>
          <button
            type="button"
            className={styles.stepBtn}
            aria-label="Plus de jours"
            disabled={days >= MAX_SMOOTH_DAYS}
            onClick={() => setDays(clampSmoothDays(days + 1))}
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.preview}>
        → −{perDay} kcal/j pendant {days} j, {startsLabel}
      </div>

      <button
        type="button"
        className={`btn btn-p btn-sm ${styles.confirmBtn}`}
        onClick={() => onConfirm(days)}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

interface ActiveRowProps {
  line: string;
  sub: string;
  scheduled?: boolean;
  onCancel: () => void;
}

function ActiveRow({ line, sub, scheduled, onCancel }: ActiveRowProps) {
  return (
    <div className={styles.activeRow}>
      <span
        className={`${styles.activeDot}${scheduled ? ` ${styles.activeDotScheduled}` : ''}`}
        aria-hidden
      />
      <div className={styles.activeBody}>
        <span className={styles.activeMain}>{line}</span>
        <span className={styles.activeSub}>{sub}</span>
      </div>
      <button type="button" className={styles.cancelBtn} onClick={onCancel}>
        Annuler
      </button>
    </div>
  );
}
