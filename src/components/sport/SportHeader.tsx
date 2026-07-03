interface Props {
  weekCount: number;
  target: number;
  streak: number;
  programLabel: string;
  onEdit: () => void;
}

export default function SportHeader({
  weekCount,
  target,
  streak,
  programLabel,
  onEdit,
}: Props) {
  return (
    <section className="kl-sport-head kl-sport-head-row">
      <div>
        <div className="kl-sport-head-tag">
          <span className="kl-sport-head-led" aria-hidden />
          {programLabel.toUpperCase()}
        </div>
        <h1 className="kl-sport-head-title">Sport</h1>
        <div className="kl-sport-head-sub">
          {weekCount}/{target} séances · 7j
          {streak > 0 && (
            <>
              {' · '}
              <span className="kl-sport-head-streak">streak {streak}</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        className="kl-sport-head-edit"
        onClick={onEdit}
        aria-label="Modifier mon programme"
      >
        <span className="material-symbols-outlined">tune</span>
      </button>
    </section>
  );
}
