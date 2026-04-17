import type { ReactNode } from 'react';

interface Props {
  icon: string;
  title: string;
  children: ReactNode;
}

export default function SettingsSection({ icon, title, children }: Props) {
  return (
    <section className="set-sec">
      <div className="set-sec-l">
        <span className="material-symbols-outlined">{icon}</span>
        {title}
      </div>
      <div className="set-card">{children}</div>
    </section>
  );
}
