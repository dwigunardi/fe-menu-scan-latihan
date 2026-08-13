import { create } from 'zustand';

interface HandshakeState {
  sessionKey: CryptoKey | null;
  handshakeToken: string | null;
  expiresAt: number | null;
  isHandshaking: boolean;
  setHandshakeSession: (sessionKey: CryptoKey, handshakeToken: string, ttlSeconds?: number) => void;
  clearHandshake: () => void;
  setIsHandshaking: (isHandshaking: boolean) => void;
  isExpired: () => boolean;
}

/**
 * RAM-Only store for cryptographic keys and handshake session tokens.
 * NEVER persisted to localStorage/sessionStorage to prevent XSS key extraction.
 */
export const useHandshakeStore = create<HandshakeState>((set, get) => ({
  sessionKey: null,
  handshakeToken: null,
  expiresAt: null,
  isHandshaking: false,

  setHandshakeSession: (sessionKey, handshakeToken, ttlSeconds = 3600) => {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    set({ sessionKey, handshakeToken, expiresAt, isHandshaking: false });
  },

  clearHandshake: () => {
    set({ sessionKey: null, handshakeToken: null, expiresAt: null, isHandshaking: false });
  },

  setIsHandshaking: (isHandshaking) => {
    set({ isHandshaking });
  },

  isExpired: () => {
    const { sessionKey, handshakeToken, expiresAt } = get();
    if (!sessionKey || !handshakeToken || !expiresAt) return true;
    // Buffer 30 seconds before expiration
    return Date.now() >= expiresAt - 30000;
  },
}));
