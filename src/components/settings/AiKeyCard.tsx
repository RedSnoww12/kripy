import { useEffect, useState } from 'react';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import { toast } from '@/components/ui/toastStore';
import SettingsSection from './SettingsSection';

export default function AiKeyCard() {
  const [value, setValue] = useState(() =>
    loadJSON<string>(STORAGE_KEYS.aiKey, ''),
  );
  const [show, setShow] = useState(false);

  useEffect(() => {
    saveJSON(STORAGE_KEYS.aiKey, value);
  }, [value]);

  const configured = value.trim().length > 0;

  const handleClear = () => {
    setValue('');
    toast('Clé API supprimée', 'info');
  };

  return (
    <SettingsSection icon="auto_awesome" title="IA — Analyse repas">
      <div className="set-f">
        <label htmlFor="aiKey">Clé API Groq</label>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            id="aiKey"
            type={show ? 'text' : 'password'}
            className="set-in"
            placeholder="gsk_..."
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
        Crée un compte gratuit sur{' '}
        <a
          href="https://console.groq.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--acc)' }}
        >
          console.groq.com
        </a>{' '}
        pour obtenir ta clé. Elle reste stockée localement, jamais envoyée au
        cloud.
      </p>
    </SettingsSection>
  );
}
