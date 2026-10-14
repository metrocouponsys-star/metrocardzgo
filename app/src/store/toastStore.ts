import { create } from 'zustand';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

// Duration per type — errors stay longer so non-technical users can read them
const TOAST_DURATION: Record<Toast['type'], number> = {
  success: 4500, // 4.5s — enough for a slow reader to confirm
  error: 6000,   // 6s — errors need more time to be understood
  info: 4000,
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${Date.now()}`;
    set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, TOAST_DURATION[type] ?? 4500);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));
