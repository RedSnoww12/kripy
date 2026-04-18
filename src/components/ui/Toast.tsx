import { useEffect, useState } from 'react';
import { type ToastItem, type ToastType, useToastStore } from './toastStore';

const ICONS: Record<ToastType, string> = {
  log: 'terminal',
  info: 'info',
  success: 'check_circle',
  warn: 'warning',
  error: 'error',
  achievement: 'trophy',
};

const LABELS: Record<ToastType, string> = {
  log: 'LOG',
  info: 'INFO',
  success: 'OK',
  warn: 'WARN',
  error: 'ERR',
  achievement: 'ACHV',
};

const COLOR_VAR: Record<ToastType, string> = {
  log: 'var(--t2)',
  info: 'var(--cyan)',
  success: 'var(--grn)',
  warn: 'var(--org)',
  error: 'var(--red)',
  achievement: 'var(--acc)',
};

const TINT_VAR: Record<ToastType, string> = {
  log: 'var(--s3)',
  info: 'var(--cyanG)',
  success: 'var(--grnG)',
  warn: 'var(--orgG)',
  error: 'var(--redG)',
  achievement: 'var(--accG)',
};

interface ToastLineProps {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function ToastLine({ item, onDismiss }: ToastLineProps) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (item.duration <= 0) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / item.duration);
      setProgress(p);
      if (p >= 1) {
        setLeaving(true);
        window.setTimeout(() => onDismiss(item.id), 320);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [item.id, item.duration, onDismiss]);

  const col = COLOR_VAR[item.type];
  const tint = TINT_VAR[item.type];
  const isAch = item.type === 'achievement';

  return (
    <div
      className={`kripy-toast kripy-toast--${item.type}${leaving ? ' kripy-toast--leaving' : ''}${mounted ? ' kripy-toast--in' : ''}`}
      role="status"
      onClick={() => onDismiss(item.id)}
      style={
        {
          '--toast-color': col,
          '--toast-tint': tint,
        } as React.CSSProperties
      }
    >
      <div className="kripy-toast-tint" aria-hidden />
      <div className="kripy-toast-scanline" aria-hidden />

      <div className="kripy-toast-row">
        <div className="kripy-toast-icon">
          <span
            className={`kripy-toast-led${isAch ? ' kripy-toast-led--pulse' : ''}`}
            aria-hidden
          />
          <span className="material-symbols-outlined kripy-toast-sym">
            {ICONS[item.type]}
          </span>
        </div>

        <div className="kripy-toast-text">
          <div className="kripy-toast-head">
            <span className="kripy-toast-label">▸ {LABELS[item.type]}</span>
            <span className="kripy-toast-ts">{formatTime(item.createdAt)}</span>
            {item.meta && <span className="kripy-toast-meta">{item.meta}</span>}
          </div>
          <div className="kripy-toast-title">{item.title}</div>
          {item.body && <div className="kripy-toast-body">{item.body}</div>}
        </div>

        {item.action && (
          <button
            type="button"
            className="kripy-toast-action"
            onClick={(e) => {
              e.stopPropagation();
              item.action?.onClick();
              onDismiss(item.id);
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>

      {item.duration > 0 && (
        <div className="kripy-toast-edge" aria-hidden>
          <div
            className="kripy-toast-edge-fill"
            style={{ width: `${(1 - progress) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ToastRoot() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="kripy-toast-root" id="toastRoot">
      {toasts.map((t) => (
        <ToastLine key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
