interface Props {
  streak: number;
}

export default function StreakBar({ streak }: Props) {
  if (streak < 2) return null;
  return (
    <div className="streak-bar" style={{ display: 'flex' }}>
      <div className="sk-l">
        <span className="sf">🔥</span>
        <span>
          <b className="sv">{streak}</b> jours consécutifs
        </span>
      </div>
      <span className="material-symbols-outlined sk-i">trending_up</span>
    </div>
  );
}
