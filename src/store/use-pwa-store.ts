import { create } from 'zustand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaState {
  isOnline: boolean;
  isInstallable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  setIsOnline: (isOnline: boolean) => void;
  setInstallPrompt: (event: BeforeInstallPromptEvent | null) => void;
  triggerInstall: () => Promise<boolean>;
}

export const usePwaStore = create<PwaState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isInstallable: false,
  installPrompt: null,

  setIsOnline: (isOnline) => set({ isOnline }),

  setInstallPrompt: (event) => {
    set({ installPrompt: event, isInstallable: Boolean(event) });
  },

  triggerInstall: async () => {
    const { installPrompt } = get();
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      set({ installPrompt: null, isInstallable: false });
      return true;
    }

    return false;
  },
}));
