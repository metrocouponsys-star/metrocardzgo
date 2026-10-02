import React from 'react';
import { useToastStore } from '../../store/toastStore';

const TOAST_CONFIG = {
  success: {
    bg: 'bg-white border-l-4 border-secondary',
    icon: 'check_circle',
    iconClass: 'text-secondary',
    titleClass: 'text-on-surface',
  },
  error: {
    bg: 'bg-white border-l-4 border-error',
    icon: 'error',
    iconClass: 'text-error',
    titleClass: 'text-on-surface',
  },
  info: {
    bg: 'bg-white border-l-4 border-accent',
    icon: 'info',
    iconClass: 'text-accent',
    titleClass: 'text-on-surface',
  },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none w-[320px]">
      {toasts.map(toast => {
        const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-dialog border border-outline-variant/30 animate-slide-in-right ${cfg.bg}`}
          >
            <span
              className={`material-symbols-outlined text-[22px] shrink-0 mt-0.5 ${cfg.iconClass}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {cfg.icon}
            </span>
            <span className={`text-[13px] font-semibold flex-1 ${cfg.titleClass} leading-snug`}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-on-surface-variant/60 hover:text-on-surface transition-colors p-0.5 rounded hover:bg-surface-container shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
