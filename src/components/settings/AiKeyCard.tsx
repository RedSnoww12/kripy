import { useEffect, useState } from 'react';
import {
  getApiKey,
  getProvider,
  PROVIDER_INFO,
  setApiKey,
  setProvider,
  type AiProvider,
} from '@/features/ai';
import { toast } from '@/components/ui/toastStore';
import SettingsSection from './SettingsSection';

const PROVIDERS: { id: AiProvider; label: string; placeholder: string }[] = [
  { id: 'gemini', label: 'Gemini', placeholder: 'AIza...' },
  { id: 'groq', label: 'Groq', placeholder: 'gsk_...' },
];

export default function AiKeyCard() {
  const [provider, setProviderState] = useState<AiProvider>(() =>
    getProvider(),
  );
  const [value, setValue] = useState<string>(() => getApiKey(provider));
  const [show, setShow] = useState(false);

  // Persiste la clé du fournisseur courant à chaque frappe.
  useEffect(() => {
    setApiKey(provider, value);
  }, [provider, value]);

  const switchProvider = (next: AiProvider) => {
    if (next === provider) return;
    setProvider(next);
    setProviderState(next);
    setValue(getApiKey(next));
    setShow(false);
  };

  const info = PROVIDER_INFO[provider];
  const configured = value.trim().length > 0;

  const handleClear = () => {
    setValue('');
    toast(`Clé API ${info.label} supprimée`, 'info');
  };

  return (
    <SettingsSection icon="auto_awesome" title="IA — Analyse repas">
      <div className="set-f" style={{ marginBottom: 12 }}>
        <label>Fournisseur d'IA</label>
        <div
          role="tablist"
          aria-label="Fournisseur d'IA"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${PROVIDERS.length}, 1fr)`,
            gap: 4,
            background: 'var(--s1)',
            padding: 4,
            borderRadius: 12,
          }}
        >
          {PROVIDERS.map((p) => {
            const active = p.id === provider;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchProvider(p.id)}
                style={{
                  height: 38,
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '.78rem',
                  background: active ? 'var(--s3)' : 'transparent',
                  color: active ? 'var(--t1)' : 'var(--t2)',
                  boxShadow: active ? 'inset 0 -2px 0 0 var(--acc)' : 'none',
                  transition: 'background .15s ease, color .15s ease',
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="set-f">
        <label htmlFor="aiKey">Clé API {info.label}</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            id="aiKey"
            type={show ? 'text' : 'password'}
            className="set-in"
            placeholder={
              PROVIDERS.find((p) => p.id === provider)?.placeholder ?? ''
            }
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-o btn-sm"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Masquer la clé' : 'Afficher la clé'}
          >
            <span className="material-symbols-outlined">
              {show ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {configured ? (
          <span className="set-status-ok">
            <span className="material-symbols-outlined">check_circle</span>
            Clé configurée
          </span>
        ) : (
          <span className="set-status-mute">Aucune clé configurée</span>
        )}
        {configured && (
          <button
            type="button"
            className="btn btn-d btn-sm"
            onClick={handleClear}
          >
            Supprimer
          </button>
        )}
      </div>
      <p
        style={{
          fontSize: '.65rem',
          color: 'var(--t3)',
          marginTop: 8,
          lineHeight: 1.5,
        }}
      >
        Crée une clé gratuite sur{' '}
        <a
          href={`https://${info.console}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--acc)' }}
        >
          {info.console}
        </a>
        . Elle reste stockée localement, jamais envoyée au cloud.
      </p>
    </SettingsSection>
  );
}
