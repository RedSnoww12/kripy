import { useMemo } from 'react';
import { useSessionStore } from '@/store/useSessionStore';

function greeting(hour: number): string {
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

export default function WelcomeHeader() {
  const user = useSessionStore((s) => s.user);

  const { hello, dateLabel } = useMemo(() => {
    const now = new Date();
    const firstName = user?.displayName?.split(' ')[0];
    return {
      hello: greeting(now.getHours()) + (firstName ? `, ${firstName}` : ''),
      dateLabel: now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    };
  }, [user]);

  return (
    <section className="home-head">
      <h1 className="home-hi">{hello}</h1>
      <p className="home-dt">{dateLabel}</p>
    </section>
  );
}
