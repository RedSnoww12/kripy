import { useEffect, type CSSProperties, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  contentStyle?: CSSProperties;
}

const DEFAULT_CONTENT_STYLE: CSSProperties = {
  maxHeight: 'calc(100dvh - 24px)',
  overflowY: 'auto',
};

export default function Modal({
  open,
  onClose,
  children,
  contentStyle,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const mergedStyle: CSSProperties = {
    ...DEFAULT_CONTENT_STYLE,
    ...contentStyle,
  };

  return (
    <div className="mo show" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={mergedStyle}
      >
        {children}
      </div>
    </div>
  );
}
