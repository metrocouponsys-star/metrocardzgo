import React from 'react';
import { useToastStore } from '../../store/toastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-elevated min-w-[280px] max-w-sm animate-slide-up
            ${toast.type === 'success' ? 'bg-secondary text-on-secondary' : ''}
            ${toast.type === 'error' ? 'bg-error text-on-error' : ''}
            ${toast.type === 'info' ? 'bg-primary text-on-primary' : ''}
          `}
        >
          <span className="material-symbols-outlined text-xl">
            {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
          </span>
          <span className="text-body-md font-medium flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
