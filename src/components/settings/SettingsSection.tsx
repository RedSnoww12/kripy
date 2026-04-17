import type { ReactNode } from 'react';

interface Props {
  icon: string;
  title: string;
  children: ReactNode;
  cardClassName?: string;
}

export default function SettingsSection({
  icon,
  title,
  children,
  cardClassName,
}: Props) {
  const className = cardClassName ? `set-card ${cardClassName}` : 'set-card';
  return (
    <section className="set-sec">
      <div className="set-sec-l">
        <span className="material-symbols-outlined">{icon}</span>
        {title}
      </div>
      <div className={className}>{children}</div>
    </section>
  );
}
