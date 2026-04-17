import AccountCard from '@/components/settings/AccountCard';
import AiKeyCard from '@/components/settings/AiKeyCard';
import DataCard from '@/components/settings/DataCard';
import PhaseCard from '@/components/settings/PhaseCard';
import ProfileCard from '@/components/settings/ProfileCard';
import TargetsCard from '@/components/settings/TargetsCard';
import TdeeCalcCard from '@/components/settings/TdeeCalcCard';
import ThemeCard from '@/components/settings/ThemeCard';

export default function SettingsPage() {
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
      <DataCard />
    </div>
  );
}
