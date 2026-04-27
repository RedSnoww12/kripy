import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AccountCard from '@/components/settings/AccountCard';
import AiKeyCard from '@/components/settings/AiKeyCard';
import DangerZoneCard from '@/components/settings/DangerZoneCard';
import DataCard from '@/components/settings/DataCard';
import FeedbackCard from '@/components/settings/FeedbackCard';
import ImportCard from '@/components/settings/ImportCard';
import PhaseCard from '@/components/settings/PhaseCard';
import ProfileCard from '@/components/settings/ProfileCard';
import TargetsCard from '@/components/settings/TargetsCard';
import TdeeCalcCard from '@/components/settings/TdeeCalcCard';
import ThemeCard from '@/components/settings/ThemeCard';

export default function SettingsPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <div className="tp active">
      <section className="set-head">
        <h1>Réglages</h1>
        <p>Configuration de ton métabolisme et de ton interface.</p>
      </section>

      <AccountCard />
      <ProfileCard />
      <TdeeCalcCard />
      <TargetsCard />
      <PhaseCard />
      <ThemeCard />
      <AiKeyCard />
      <ImportCard />
      <DataCard />
      <FeedbackCard />
      <DangerZoneCard />
    </div>
  );
}
