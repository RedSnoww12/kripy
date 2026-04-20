import { useMemo, useState } from 'react';
import SettingsSection from './SettingsSection';
import { toast } from '@/components/ui/toastStore';
import { useSessionStore } from '@/store/useSessionStore';
import {
  FEEDBACK_MAX_LEN,
  FEEDBACK_MIN_LEN,
  loadLocalFeedback,
  submitFeedback,
  type FeedbackType,
} from '@/features/feedback/feedback';

interface Option {
  key: FeedbackType;
  label: string;
  icon: string;
}

const OPTIONS: readonly Option[] = [
  { key: 'bug', label: 'Bug', icon: 'bug_report' },
  { key: 'feature', label: 'Idée', icon: 'lightbulb' },
  { key: 'other', label: 'Autre', icon: 'chat_bubble' },
];

const APP_VERSION = import.meta.env.VITE_APP_VERSION as string | undefined;

export default function FeedbackCard() {
  const user = useSessionStore((s) => s.user);
  const [type, setType] = useState<FeedbackType>('bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState(() => loadLocalFeedback());

  const trimmedLen = message.trim().length;
  const canSubmit = trimmedLen >= FEEDBACK_MIN_LEN && !busy;
  const remaining = FEEDBACK_MAX_LEN - message.length;
  const lastSynced = useMemo(() => history.find((h) => h.synced), [history]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    const res = await submitFeedback(
      { type, message, email: email.trim() || undefined },
      {
        uid: user?.uid ?? null,
        displayName: user?.displayName ?? null,
        appVersion: APP_VERSION,
      },
    );
    setBusy(false);
    if (!res.ok) {
      toast(res.error ?? 'Envoi impossible', 'error');
      return;
    }
    setMessage('');
    setHistory(loadLocalFeedback());
    toast(
      res.entry?.synced ? 'Merci, feedback envoyé !' : 'Feedback enregistré',
      'success',
    );
  };

  return (
    <SettingsSection icon="forum" title="Feedback & suggestions" id="feedback">
      <p
        style={{
          fontSize: '.7rem',
          color: 'var(--t2)',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Bug rencontré, idée de feature ou autre retour ? Dis-le-nous ici —
        chaque message est lu.
      </p>

      <div
        role="radiogroup"
        aria-label="Type de feedback"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
          marginTop: 10,
        }}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={type === opt.key}
            className={`set-theme-btn${type === opt.key ? ' sel' : ''}`}
            onClick={() => setType(opt.key)}
          >
            <span className="material-symbols-outlined">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="set-f" style={{ marginTop: 10 }}>
        <label htmlFor="feedbackMessage">Message</label>
        <textarea
          id="feedbackMessage"
          className="set-textarea"
          placeholder={
            type === 'bug'
              ? 'Décris le bug : étapes, résultat observé, résultat attendu...'
              : type === 'feature'
                ? 'Quelle feature aimerais-tu voir ? À quoi servirait-elle ?'
                : 'Partage ton retour...'
          }
          value={message}
          maxLength={FEEDBACK_MAX_LEN}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '.62rem',
            color: 'var(--t3)',
            marginTop: 4,
          }}
        >
          <span>
            {trimmedLen < FEEDBACK_MIN_LEN
              ? `Encore ${FEEDBACK_MIN_LEN - trimmedLen} caractère${FEEDBACK_MIN_LEN - trimmedLen > 1 ? 's' : ''}`
              : 'Prêt à envoyer'}
          </span>
          <span>{remaining}</span>
        </div>
      </div>

      {!user && (
        <div className="set-f" style={{ marginTop: 8 }}>
          <label htmlFor="feedbackEmail">Email (optionnel)</label>
          <input
            id="feedbackEmail"
            type="email"
            className="set-in"
            placeholder="pour qu’on puisse te répondre"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      <button
        type="button"
        className="btn btn-p"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{ width: '100%', marginTop: 10 }}
      >
        <span className="material-symbols-outlined">send</span>
        {busy ? 'Envoi...' : 'Envoyer'}
      </button>

      <p
        style={{
          fontSize: '.62rem',
          color: 'var(--t3)',
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        {history.length > 0 ? (
          <>
            {history.length} message{history.length > 1 ? 's' : ''} envoyé
            {history.length > 1 ? 's' : ''}
            {lastSynced ? ' · dernier synchronisé dans le cloud' : ''}
            {!lastSynced ? ' · stocké localement (sera renvoyé plus tard)' : ''}
            .
          </>
        ) : (
          <>
            Tes messages sont envoyés au cloud si tu es connecté, sinon gardés
            localement.
          </>
        )}
      </p>
    </SettingsSection>
  );
}
