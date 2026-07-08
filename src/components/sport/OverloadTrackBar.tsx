import type { OverloadTrack } from '@/features/sport/nextSession';

interface Props {
  track: OverloadTrack;
  /** lg : version détaillée avec repères de reps sous la barre. */
  size?: 'sm' | 'lg';
}

export default function OverloadTrackBar({ track, size = 'sm' }: Props) {
  const { lo, hi, reps, current, next, kind } = track;
  const steps: number[] = [];
  for (let r = lo; r <= hi; r++) steps.push(r);
  const showTicks = size === 'lg' && steps.length <= 10;

  return (
    <div className={`kl-track ${size === 'lg' ? 'kl-track-lg' : ''}`}>
      <div className="kl-track-top">
        <span className="kl-track-load">{current}</span>
        <span className="kl-track-pos">
          {Math.min(reps, hi)}
          <span className="kl-track-pos-max">/{hi} reps</span>
        </span>
        <span className={`kl-track-next kind-${kind}`}>
          <span
            className="material-symbols-outlined kl-track-next-ico"
            aria-hidden
          >
            {kind === 'deload'
              ? 'south'
              : kind === 'ai'
                ? 'auto_awesome'
                : 'arrow_forward'}
          </span>
          {next}
        </span>
      </div>
      <div
        className="kl-track-bar"
        role="img"
        aria-label={`${Math.min(reps, hi)} répétitions sur ${hi} à ${current}, ensuite ${next}`}
      >
        {steps.map((r) => (
          <span key={r} className={`kl-track-seg ${r <= reps ? 'on' : ''}`}>
            {showTicks && <span className="kl-track-tick">{r}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
