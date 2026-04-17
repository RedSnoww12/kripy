import { useEffect } from 'react';
import { type ToastItem, type ToastType, useToastStore } from './toastStore';

const ICONS: Record<ToastType, string> = {
  success: '\u2713',
  error: '\u00D7',
  warn: '!',
  info: 'i',
};

interface ToastLineProps {
  item: ToastItem;
  onDismiss: (id: number) => void;
}

function ToastLine({ item, onDismiss }: ToastLineProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(item.id), item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss]);

  return (
    <div
      className={`toast ${item.type}`}
      onClick={() => onDismiss(item.id)}
      role="status"
    >
      <span className="tIco">{ICONS[item.type]}</span>
      <span>{item.message}</span>
    </div>
  );
}

export default function ToastRoot() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="toast-root" id="toastRoot">
      {toasts.map((t) => (
        <ToastLine key={t.id} item={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
