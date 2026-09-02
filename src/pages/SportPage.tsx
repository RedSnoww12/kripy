import { useMemo, useState } from 'react';
import SportTypeSelector from '@/components/sport/SportTypeSelector';
import OtherSportForm from '@/components/sport/OtherSportForm';
import WorkoutHistory from '@/components/sport/WorkoutHistory';
import SportHeader, { type HeaderDay } from '@/components/sport/SportHeader';
import ActivityHeatmap from '@/components/sport/ActivityHeatmap';
import TrainingSetupWizard from '@/components/sport/TrainingSetupWizard';
import SessionLogger from '@/components/sport/SessionLogger';
import CoachCard from '@/components/sport/CoachCard';
import TrainingLoadCard from '@/components/sport/TrainingLoadCard';
import MuscleVolumeCard from '@/components/sport/MuscleVolumeCard';
import ProgressionSection from '@/components/sport/ProgressionSection';
import {
  makeExerciseResolver,
  makeMuscleResolver,
  styleMeta,
} from '@/data/exercises';
import { buildCoachReport } from '@/features/sport/coach';
import {
  weeklyGoalStreak,
  weekSessionCount,
} from '@/features/sport/progression';
import { useSportStore } from '@/store/useSportStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { shiftISO, todayISO } from '@/lib/date';
import type { SportCategory } from '@/types';

type Tab = 'muscu' | 'autres';

export default function SportPage() {
  const profile = useSportStore((s) => s.profile);
  const setProfile = useSportStore((s) => s.setProfile);
  const sessions = useSportStore((s) => s.sessions);
  const workouts = useTrackingStore((s) => s.workouts);

  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('muscu');
  const [category, setCategory] =
    useState<Exclude<SportCategory, 'muscu'>>('cardio');

  const today = todayISO();
  const target = profile?.sessionsPerWeek ?? 0;

  const { weekCount, weekStreak, days } = useMemo(() => {
    const dates = [...new Set(workouts.map((w) => w.date))];
    const strengthDates = new Set(sessions.map((s) => s.date));
    const activeDates = new Set(dates);
    const last7: HeaderDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = shiftISO(today, -i);
      last7.push({
        date,
        active: activeDates.has(date),
        strength: strengthDates.has(date),
      });
    }
    return {
      weekCount: weekSessionCount(dates, today),
      weekStreak: weeklyGoalStreak(dates, target, today),
      days: last7,
    };
  }, [workouts, sessions, today, target]);

  const resolve = useMemo(
    () => makeExerciseResolver(profile?.customExercises ?? []),
    [profile?.customExercises],
  );
  const resolveMuscle = useMemo(
    () => makeMuscleResolver(profile?.customExercises ?? []),
    [profile?.customExercises],
  );

  const report = useMemo(
    () =>
      profile
        ? buildCoachReport(profile, sessions, resolve, resolveMuscle, today)
        : null,
    [profile, sessions, resolve, resolveMuscle, today],
  );

  if (!profile || editing || !report) {
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
        weekStreak={weekStreak}
        days={days}
        programLabel={`${styleMeta(profile.style).label} · ${profile.sessionTemplates.length} séance${profile.sessionTemplates.length > 1 ? 's' : ''}`}
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
          <CoachCard
            profile={profile}
            report={report}
            hasSessions={sessions.length > 0}
          />
          {sessions.length > 0 && (
            <TrainingLoadCard windows={report.windows} status={report.status} />
          )}
          <MuscleVolumeCard profile={profile} />
          <ProgressionSection profile={profile} />
        </>
      ) : (
        <>
          <SportTypeSelector value={category} onChange={setCategory} />
          <OtherSportForm category={category} />
        </>
      )}

      <ActivityHeatmap workouts={workouts} sessions={sessions} />
      <WorkoutHistory />
    </div>
  );
}
