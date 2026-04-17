import { useTrackingStore } from '@/store/useTrackingStore';

interface Props {
  date: string;
}

export default function WaterTracker({ date }: Props) {
  const count = useTrackingStore((s) => s.water[date] ?? 0);
  const setWaterForDate = useTrackingStore((s) => s.setWaterForDate);

  const adjust = (delta: number) => {
    const next = Math.max(0, count + delta);
    setWaterForDate(date, next);
  };

  return (
    <div className="bento bento-water">
      <div className="bn-h">
        <span className="material-symbols-outlined bn-ico">water_drop</span>
        <span className="bn-l">Hydratation</span>
      </div>
      <div className="bn-v">
        <span>{(count * 0.25).toFixed(1)}</span>
        <span className="bn-u">L</span>
      </div>
      <div className="bn-acts">
        <button
          type="button"
          className="bn-btn"
          aria-label="Moins d'eau"
          onClick={() => adjust(-1)}
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button
          type="button"
          className="bn-btn bn-btn-p"
          aria-label="Plus d'eau"
          onClick={() => adjust(1)}
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>
    </div>
  );
}
