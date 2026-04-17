import { useSettingsStore } from '@/store/useSettingsStore';
import SettingsSection from './SettingsSection';
import type { Theme } from '@/types';

const OPTIONS: readonly { key: Theme; label: string; icon: string }[] = [
  { key: 'dark', label: 'Sombre', icon: 'dark_mode' },
  { key: 'light', label: 'Clair', icon: 'light_mode' },
];

export default function ThemeCard() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <SettingsSection icon="palette" title="Thème">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`set-theme-btn${theme === opt.key ? ' sel' : ''}`}
            onClick={() => setTheme(opt.key)}
          >
            <span className="material-symbols-outlined">{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </SettingsSection>
  );
}
