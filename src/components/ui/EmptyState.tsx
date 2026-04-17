import type { ReactNode } from 'react';

interface Props {
  icon: string;
  title: string;
  subtitle?: string;
  cta?: {
    label: string;
    icon?: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  cta,
  children,
}: Props) {
  return (
    <div className="empty-state" role="status">
      <span className="material-symbols-outlined empty-state-ico">{icon}</span>
      <h4 className="empty-state-t">{title}</h4>
      {subtitle && <p className="empty-state-s">{subtitle}</p>}
      {cta && (
        <button
          type="button"
          className="btn btn-p empty-state-cta"
          onClick={cta.onClick}
        >
          {cta.icon && (
            <span className="material-symbols-outlined">{cta.icon}</span>
          )}
          {cta.label}
        </button>
      )}
      {children}
    </div>
  );
}
