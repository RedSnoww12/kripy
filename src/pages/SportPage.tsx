import { useMemo, useState } from 'react';
import SportTypeSelector from '@/components/sport/SportTypeSelector';
import OtherSportForm from '@/components/sport/OtherSportForm';
import WorkoutHistory from '@/components/sport/WorkoutHistory';
import SportHeader from '@/components/sport/SportHeader';
import ActivityHeatmap from '@/components/sport/ActivityHeatmap';
import TrainingSetupWizard from '@/components/sport/TrainingSetupWizard';
import SessionLogger from '@/components/sport/SessionLogger';
import CoachCard from '@/components/sport/CoachCard';
import ProgressionSection from '@/components/sport/ProgressionSection';
import { styleMeta, splitMeta } from '@/data/exercises';
import { weekSessionCount } from '@/features/sport/progression';
import { useSportStore } from '@/store/useSportStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { todayISO } from '@/lib/date';
import type { SportCategory } from '@/types';

type Tab = 'muscu' | 'autres';

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + 'T00:00:00').getTime();
  const b = new Date(bISO + 'T00:00:00').getTime();
  return Math.round((b - a) / 86_400_000);
}

export default function SportPage() {
  const profile = useSportStore((s) => s.profile);
  const setProfile = useSportStore((s) => s.setProfile);
  const workouts = useTrackingStore((s) => s.workouts);

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('muscu');
  const [category, setCategory] =
    useState<Exclude<SportCategory, 'muscu'>>('cardio');

  const { weekCount, streak } = useMemo(() => {
    const today = todayISO();
    const dates = [...new Set(workouts.map((w) => w.date))];
    const count = weekSessionCount(dates, today);
    const sortedDates = dates.sort();
    let s = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const gap = daysBetween(sortedDates[i], today);
      if (gap === s || gap === s + 1) {
        s = gap + 1;
      } else {
        break;
      }
    }
    return { weekCount: count, streak: s };
  }, [workouts]);

  if (!profile || editing) {
    return (
      <TrainingSetupWizard
        initial={profile}
        onDone={(p) => {
          setProfile(p);
          setEditing(false);
        }}
        onCancel={profile ? () => setEditing(false) : undefined}
      />
    );
  }

  return (
    <div className="tp active">
      <SportHeader
        weekCount={weekCount}
        target={profile.sessionsPerWeek}
        streak={streak}
        programLabel={`${styleMeta(profile.style).label} · ${splitMeta(profile.split).label}`}
        onEdit={() => setEditing(true)}
      />

      <div className="kl-sport-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'muscu'}
          className={`kl-sport-tab ${tab === 'muscu' ? 'on' : ''}`}
          onClick={() => setTab('muscu')}
        >
          Entraînement
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'autres'}
          className={`kl-sport-tab ${tab === 'autres' ? 'on' : ''}`}
          onClick={() => setTab('autres')}
        >
          Autres sports
        </button>
      </div>

      {tab === 'muscu' ? (
        <>
          <SessionLogger profile={profile} />
          <CoachCard profile={profile} />
          <ProgressionSection profile={profile} />
        </>
      ) : (
        <>
          <SportTypeSelector value={category} onChange={setCategory} />
          <OtherSportForm category={category} />
        </>
      )}

      <ActivityHeatmap workouts={workouts} />
      <WorkoutHistory />
    </div>
  );
}
