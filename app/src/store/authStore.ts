import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  originalAdminUser: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  updateUser: (partial: Partial<AuthUser>) => void;
  impersonate: (merchantId: string, merchantName: string) => void;
  stopImpersonating: () => void;
  logout: () => void;
}

// Storage wrapper that handles both sessionStorage and localStorage
const hybridStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(name) || localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    // Save to sessionStorage so closing tab automatically logs out
    sessionStorage.setItem(name, value);
    localStorage.setItem(name, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(name);
    localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      originalAdminUser: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true, originalAdminUser: null }),
      updateUser: (partial) => set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      impersonate: (merchantId, merchantName) => set((state) => {
        if (state.user?.role !== 'super_admin' && !state.originalAdminUser) return {};
        const adminBackup = state.originalAdminUser || state.user;
        return {
          originalAdminUser: adminBackup,
          user: {
            id: adminBackup!.id,
            name: adminBackup!.name,
            phone: adminBackup!.phone,
            role: 'owner',
            merchant_id: merchantId,
            merchant_name: merchantName,
          }
        };
      }),
      stopImpersonating: () => set((state) => {
        if (!state.originalAdminUser) return {};
        return {
          user: state.originalAdminUser,
          originalAdminUser: null,
        };
      }),
      logout: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('metro-cardz-auth');
          sessionStorage.removeItem('metro-cardz-refresh');
          localStorage.removeItem('metro-cardz-auth');
          localStorage.removeItem('metro-cardz-refresh');
        }
        set({ user: null, token: null, originalAdminUser: null, isAuthenticated: false });
      },
    }),
    {
      name: 'metro-cardz-auth',
      storage: createJSONStorage(() => hybridStorage),
    }
  )
);
