import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export function useTheme(): void {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
}
