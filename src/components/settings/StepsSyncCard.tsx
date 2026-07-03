import { useState } from 'react';
import { toast } from '@/components/ui/toastStore';
import {
  connectStepsSync,
  describeStepsSyncError,
  disconnectStepsSync,
  fetchSteps,
  isStepsSyncConfigured,
  isStepsSyncConnected,
} from '@/features/steps/googleFit';
import { useTrackingStore } from '@/store/useTrackingStore';
import SettingsSection from './SettingsSection';
import styles from './StepsSyncCard.module.css';

export default function StepsSyncCard() {
  const setStepsForDate = useTrackingStore((s) => s.setStepsForDate);
  const steps = useTrackingStore((s) => s.steps);
  const [connected, setConnected] = useState(isStepsSyncConnected());
  const [busy, setBusy] = useState(false);

  const configured = isStepsSyncConfigured();

  const handleConnect = async () => {
    setBusy(true);
    try {
      await connectStepsSync();
      setConnected(true);
      toast('Google Fit connecté', 'success');
    } catch (e) {
      toast(describeStepsSyncError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    setBusy(true);
    try {
      const fetched = await fetchSteps(7);
      let updated = 0;
      for (const [date, value] of Object.entries(fetched)) {
        const merged = Math.max(steps[date] ?? 0, value);
        if (merged !== (steps[date] ?? 0)) {
          setStepsForDate(date, merged);
          updated += 1;
        }
      }
      toast(
        updated > 0
          ? `Pas synchronisés (${updated} jour${updated > 1 ? 's' : ''})`
          : 'Pas déjà à jour',
        'success',
      );
    } catch (e) {
      setConnected(isStepsSyncConnected());
      toast(describeStepsSyncError(e), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    disconnectStepsSync();
    setConnected(false);
    toast('Google Fit déconnecté', 'success');
  };

  return (
    <SettingsSection icon="steps" title="Pas & santé">
      {configured ? (
        <div className={styles.actions}>
          {!connected ? (
            <button
              type="button"
              className="btn btn-p"
              disabled={busy}
              onClick={handleConnect}
            >
              Connecter Google Fit
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-p"
                disabled={busy}
                onClick={handleSync}
              >
                {busy ? 'Synchronisation…' : 'Synchroniser les pas · 7j'}
              </button>
              <button
                type="button"
                className="btn btn-o"
                disabled={busy}
                onClick={handleDisconnect}
              >
                Déconnecter
              </button>
            </>
          )}
        </div>
      ) : (
        <p className={styles.hint}>
          Synchronisation Google Fit non configurée sur ce déploiement (variable{' '}
          <code>VITE_GOOGLE_FIT_CLIENT_ID</code>).
        </p>
      )}
      <p className={styles.hint}>
        <strong>Android</strong> : connecte Google Fit ci-dessus — les montres
        (Garmin, etc.) reliées à Google Fit ou Health Connect remontent
        automatiquement.
        <br />
        <strong>iPhone</strong> : crée un Raccourci Apple Santé qui ouvre l'app
        avec <code>?steps=NOMBRE</code> — les pas du jour sont importés
        automatiquement.
        <br />
        <strong>Garmin</strong> : l'API Garmin n'est pas ouverte aux
        applications web ; passe par Google Fit (app Health Sync) ou saisis tes
        pas en un tap sur l'accueil.
      </p>
    </SettingsSection>
  );
}
