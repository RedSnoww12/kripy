import { useState, type ChangeEvent } from 'react';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/toastStore';
import { deleteAccount } from '@/features/auth/useAuth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import SettingsSection from './SettingsSection';

const CONFIRM_PHRASE = 'SUPPRIMER';

type Step = 'idle' | 'first' | 'second';

export default function DangerZoneCard() {
  const user = useSessionStore((s) => s.user);
  const [step, setStep] = useState<Step>('idle');
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);

  const log = useNutritionStore((s) => s.log);
  const recipes = useNutritionStore((s) => s.recipes);
  const savedMeals = useNutritionStore((s) => s.savedMeals);
  const weights = useTrackingStore((s) => s.weights);
  const workouts = useTrackingStore((s) => s.workouts);
  const steps = useTrackingStore((s) => s.steps);
  const water = useTrackingStore((s) => s.water);
  const phase = useSettingsStore((s) => s.phase);
  const targets = useSettingsStore((s) => s.targets);

  if (!user) return null;

  const close = () => {
    if (busy) return;
    setStep('idle');
    setPhrase('');
  };

  const handleExportFirst = () => {
    const payload = {
      account: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
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
      reason: 'pre-account-deletion',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kripy_backup_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Sauvegarde téléchargée', 'success');
  };

  const handleDelete = async () => {
    if (phrase.trim().toUpperCase() !== CONFIRM_PHRASE) return;
    setBusy(true);
    try {
      await deleteAccount();
      toast('Compte supprimé', 'success');
      window.setTimeout(() => {
        window.location.href = '/';
      }, 600);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') {
        toast('Réauthentification annulée', 'warn');
      } else {
        toast(`Erreur : ${(e as Error).message}`, 'error');
      }
      setBusy(false);
    }
  };

  return (
    <>
      <SettingsSection icon="warning" title="Zone de danger">
        <p
          style={{
            fontSize: '.72rem',
            color: 'var(--t2)',
            lineHeight: 1.55,
            marginBottom: 12,
          }}
        >
          Supprime définitivement ton compte Kripy et toutes les données
          associées (cloud + local). Cette action est irréversible.
        </p>
        <button
          type="button"
          className="btn btn-d"
          onClick={() => setStep('first')}
          disabled={!isFirebaseConfigured}
        >
          <span className="material-symbols-outlined">person_remove</span>
          Supprimer mon compte
        </button>
        {!isFirebaseConfigured && (
          <p
            style={{
              fontSize: '.65rem',
              color: 'var(--t3)',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Firebase non configuré : aucun compte cloud à supprimer.
          </p>
        )}
      </SettingsSection>

      <Modal open={step === 'first'} onClose={close}>
        <h3 style={{ color: 'var(--red)' }}>Supprimer ton compte ?</h3>
        <div className="fp">
          Tu es sur le point de supprimer définitivement ton compte Kripy. Ce
          que ça implique :
          <ul style={{ margin: '10px 0 0 18px', padding: 0, lineHeight: 1.7 }}>
            <li>Suppression de tes données cloud (Firestore).</li>
            <li>Suppression de ton authentification Google côté Firebase.</li>
            <li>Effacement complet de tes données locales sur cet appareil.</li>
            <li>Aucune possibilité de récupération.</li>
          </ul>
        </div>
        <p style={{ fontSize: '.74rem', color: 'var(--t2)', lineHeight: 1.55 }}>
          On te recommande de télécharger une sauvegarde JSON avant de
          continuer.
        </p>
        <button
          type="button"
          className="btn btn-o"
          style={{ width: '100%', marginTop: 10 }}
          onClick={handleExportFirst}
        >
          <span className="material-symbols-outlined">download</span>
          Télécharger ma sauvegarde
        </button>
        <div className="acts">
          <button type="button" className="btn btn-o" onClick={close}>
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-d"
            onClick={() => setStep('second')}
          >
            Continuer
          </button>
        </div>
      </Modal>

      <Modal open={step === 'second'} onClose={close}>
        <h3 style={{ color: 'var(--red)' }}>Dernière confirmation</h3>
        <div className="fp">
          Pour confirmer, tape <strong>{CONFIRM_PHRASE}</strong> ci-dessous.
          Cette action est définitive.
        </div>
        <input
          type="text"
          value={phrase}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPhrase(e.target.value)
          }
          placeholder={CONFIRM_PHRASE}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'var(--s2)',
            border: '1px solid var(--s4)',
            borderRadius: 12,
            color: 'var(--t1)',
            fontSize: '0.95rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textAlign: 'center',
            outline: 'none',
          }}
        />
        <div className="acts">
          <button
            type="button"
            className="btn btn-o"
            onClick={close}
            disabled={busy}
          >
            Annuler
          </button>
          <button
            type="button"
            className="btn btn-d"
            onClick={handleDelete}
            disabled={busy || phrase.trim().toUpperCase() !== CONFIRM_PHRASE}
          >
            {busy ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </Modal>
    </>
  );
}
