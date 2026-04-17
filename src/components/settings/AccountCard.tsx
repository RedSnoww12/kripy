import { useState } from 'react';
import { signOutUser } from '@/features/auth/useAuth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useSessionStore } from '@/store/useSessionStore';
import { toast } from '@/components/ui/toastStore';
import SettingsSection from './SettingsSection';

export default function AccountCard() {
  const user = useSessionStore((s) => s.user);
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await signOutUser();
      toast('Déconnecté', 'info');
      window.location.reload();
    } catch (e) {
      toast(`Erreur déconnexion : ${(e as Error).message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <SettingsSection icon="account_circle" title="Compte">
        <div className="set-acc-guest">
          <span className="material-symbols-outlined">person_off</span>
          <p>
            <strong>Mode local</strong>
            <br />
            Connecte-toi pour sauvegarder tes données dans le cloud et les
            retrouver sur tous tes appareils.
          </p>
        </div>
      </SettingsSection>
    );
  }

  const initial = (user.displayName ?? '?')[0].toUpperCase();
  const avatar = user.photoURL ? (
    <img src={user.photoURL} className="set-acc-avatar" alt="" />
  ) : (
    <div className="set-acc-avatar set-acc-avatar-fallback">{initial}</div>
  );

  return (
    <SettingsSection icon="account_circle" title="Compte">
      <div className="set-acc-row">
        {avatar}
        <div className="set-acc-meta">
          <div className="set-acc-name">
            {user.displayName ?? 'Utilisateur'}
          </div>
          <div className="set-acc-mail">{user.email}</div>
          <div className="set-acc-st">
            <span className="material-symbols-outlined">cloud_done</span>
            Connecté{isFirebaseConfigured ? ' + cloud sync' : ''}
          </div>
        </div>
        <button
          type="button"
          className="set-acc-logout"
          aria-label="Déconnexion"
          onClick={handleLogout}
          disabled={busy}
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </SettingsSection>
  );
}
