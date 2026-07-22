import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
            role: 'owner', // act as owner
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
      logout: () => set({ user: null, token: null, originalAdminUser: null, isAuthenticated: false }),
    }),
    {
      name: 'metro-cardz-auth',
    }
  )
);
