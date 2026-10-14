import React from 'react';
import { useToastStore } from '../../store/toastStore';

const TOAST_CONFIG = {
  success: {
    bg: 'bg-green-50 border-l-4 border-green-500',
    icon: 'check_circle',
    iconClass: 'text-green-600',
    titleClass: 'text-green-900',
  },
  error: {
    bg: 'bg-red-50 border-l-4 border-red-500',
    icon: 'error',
    iconClass: 'text-red-600',
    titleClass: 'text-red-900',
  },
  info: {
    bg: 'bg-blue-50 border-l-4 border-blue-500',
    icon: 'info',
    iconClass: 'text-blue-600',
    titleClass: 'text-blue-900',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-[360px]">
      {toasts.map(toast => {
        const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
        return (
          <div
            key={toast.id}
            role="alert"
            aria-live="assertive"
            className={`pointer-events-auto flex items-start gap-3 px-5 py-4 rounded-2xl shadow-xl border border-black/5 animate-slide-in-right ${cfg.bg}`}
          >
            <span
              className={`material-symbols-outlined text-[28px] shrink-0 mt-0.5 ${cfg.iconClass}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {cfg.icon}
            </span>
            <span className={`text-[15px] font-bold flex-1 ${cfg.titleClass} leading-snug`}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className={`shrink-0 p-1 rounded-lg transition-colors hover:bg-black/10 ${cfg.titleClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
