import { useSettingsStore } from '@/store/useSettingsStore';
import { useSessionStore } from '@/store/useSessionStore';
import { PHASE_COLORS } from '@/data/constants';

export default function Header() {
  const phase = useSettingsStore((s) => s.phase);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const user = useSessionStore((s) => s.user);

  const phaseColor = PHASE_COLORS[phase];
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <div className="hdr">
      <div className="hdr-l">
        <div className="logo">KRIPY</div>
        <div
          className="ph-pill"
          style={{
            color: phaseColor,
            background: `${phaseColor}10`,
            borderColor: `${phaseColor}25`,
          }}
        >
          <span className="d" style={{ background: phaseColor }} />
          <span>Phase {phase}</span>
        </div>
      </div>
      <div className="hdr-r">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Changer le thème"
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
        {user?.photoURL && <img className="u-ava" src={user.photoURL} alt="" />}
      </div>
    </div>
  );
}
