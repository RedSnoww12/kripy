import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import SettingsSection from './SettingsSection';

export default function DataCard() {
  const log = useNutritionStore((s) => s.log);
  const recipes = useNutritionStore((s) => s.recipes);
  const savedMeals = useNutritionStore((s) => s.savedMeals);
  const weights = useTrackingStore((s) => s.weights);
  const workouts = useTrackingStore((s) => s.workouts);
  const steps = useTrackingStore((s) => s.steps);
  const water = useTrackingStore((s) => s.water);
  const phase = useSettingsStore((s) => s.phase);
  const targets = useSettingsStore((s) => s.targets);

  const handleExport = () => {
    const payload = {
      log,
      recipes,
      savedMeals,
      weights,
      workouts,
      steps,
      water,
      phase,
      targets,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kripy_${todayISO()}.json`;
    a.click();
    toast('Export téléchargé', 'success');
  };

  const handleReset = () => {
    const confirmed = window.confirm(
      'Supprimer toutes les données locales ? (la sync cloud n’est pas touchée)',
    );
    if (!confirmed) return;
    localStorage.clear();
    window.location.reload();
  };

  return (
    <SettingsSection icon="database" title="Données">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button type="button" className="btn btn-o" onClick={handleExport}>
          <span className="material-symbols-outlined">download</span>
          Exporter JSON
        </button>
        <button type="button" className="btn btn-d" onClick={handleReset}>
          <span className="material-symbols-outlined">delete_forever</span>
          Réinitialiser
        </button>
      </div>
      <p
        style={{
          fontSize: '.65rem',
          color: 'var(--t3)',
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        L'export contient log / pesées / workouts / steps / water / recettes /
        phase / targets. La réinitialisation efface tout ton localStorage (la
        sync cloud reprendra au prochain login).
      </p>
    </SettingsSection>
  );
}
