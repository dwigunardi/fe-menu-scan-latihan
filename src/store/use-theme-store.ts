import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'light',

      setTheme: (theme) => {
        const resolvedTheme =
          theme === 'system'
            ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
            : theme;

        if (typeof document !== 'undefined') {
          if (resolvedTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }

        set({ theme, resolvedTheme });
      },

      initTheme: () => {
        const { theme } = get();
        get().setTheme(theme);
      },
    }),
    {
      name: 'app_theme_preference',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
