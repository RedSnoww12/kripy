import { useMemo } from 'react';
import { useSessionStore } from '@/store/useSessionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePalierStore } from '@/store/usePalierStore';
import { PHASE_COLORS } from '@/data/constants';
import { todayISO } from '@/lib/date';

interface Props {
  streak: number;
}

function greeting(hour: number): string {
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function daysSince(startISO: string, todayIso: string): number {
  const a = new Date(startISO + 'T00:00:00').getTime();
  const b = new Date(todayIso + 'T00:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export default function WelcomeHeader({ streak }: Props) {
  const user = useSessionStore((s) => s.user);
  const phase = useSettingsStore((s) => s.phase);
  const palier = usePalierStore((s) => s.palier);

  const { hello, dateLine, palierTag } = useMemo(() => {
    const now = new Date();
    const firstName = user?.displayName?.split(' ')[0];
    const today = todayISO();
    const d = now
      .toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      .replace('.', '')
      .toUpperCase();
    const tag = palier
      ? `PALIER D+${daysSince(palier.startDate, today)}`
      : `PHASE ${phase}`;
    return {
      hello: greeting(now.getHours()) + (firstName ? ', ' : ''),
      firstName,
      dateLine: d,
      palierTag: tag,
    };
  }, [user, palier, phase]);

  const phaseColor = PHASE_COLORS[phase];
  const firstName = user?.displayName?.split(' ')[0];

  return (
    <section className="kl-head">
      <div className="kl-head-l">
        <div className="kl-head-tag">
          <span
            className="kl-head-dot"
            style={{
              background: phaseColor,
              boxShadow: `0 0 8px ${phaseColor}`,
            }}
            aria-hidden
          />
          KRIPY · PRECISION LAB
        </div>
        <h1 className="kl-head-hi">
          {hello}
          {firstName && <span className="kl-head-name">{firstName}</span>}
        </h1>
        <div className="kl-head-sub">
          {dateLine} · <span style={{ color: phaseColor }}>{palierTag}</span>
        </div>
      </div>
      <div className="kl-head-r">
        {streak >= 2 && (
          <span className="kl-head-streak">STREAK {streak}J</span>
        )}
      </div>
    </section>
  );
}
