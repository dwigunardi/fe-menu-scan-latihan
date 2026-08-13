import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TableSession {
  tableNumber: string; // e.g. "01", "05"
  customerName: string; // e.g. "Dewi"
  tableSessionToken: string; // token issued by backend table binding
  isConfirmed: boolean;
  createdAt: number;
}

interface TableState {
  session: TableSession | null;
  setTableSession: (session: Omit<TableSession, 'createdAt'>) => void;
  clearTableSession: () => void;
  validateWithCurrentTable: (currentTableParam: string | null) => boolean;
}

/**
 * Customer Table Session Store with localStorage persistence and server-validation guard.
 */
export const useTableStore = create<TableState>()(
  persist(
    (set, get) => ({
      session: null,

      setTableSession: (sessionData) => {
        set({
          session: {
            ...sessionData,
            createdAt: Date.now(),
          },
        });
      },

      clearTableSession: () => {
        set({ session: null });
      },

      validateWithCurrentTable: (currentTableParam) => {
        const { session } = get();
        if (!session) return false;

        // If URL has a different table than stored session, invalidate old session
        if (currentTableParam && currentTableParam !== session.tableNumber) {
          set({ session: null });
          return false;
        }

        return true;
      },
    }),
    {
      name: 'kumpul_cafe_table_session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
