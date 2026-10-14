import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div className={`relative w-full ${maxWidth} max-h-[85vh] md:max-h-[90vh] bg-white rounded-2xl shadow-dialog animate-scale-in flex flex-col my-auto overflow-hidden border border-outline-variant/30`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 shrink-0">
            <h3 className="text-[18px] font-extrabold text-on-surface font-display">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface active:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 max-h-[calc(85vh-70px)]">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  danger?: boolean;
}

/**
 * ConfirmModal — Used for all destructive or irreversible actions.
 * 
 * For danger=true actions, shows a prominent red warning banner so non-technical
 * users clearly understand the consequence before tapping the confirm button.
 * The confirm button is deliberately placed LAST (right side) to match user
 * expectations, and Cancel is always immediately accessible.
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading,
  danger,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Danger warning banner — unmissable for non-technical users */}
        {danger && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <span
              className="material-symbols-outlined text-red-600 text-[28px] shrink-0 mt-0.5"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <div>
              <p className="font-extrabold text-red-900 text-[15px] mb-1">⚠️ This action cannot be undone</p>
              <p className="text-red-700 text-[13px] leading-relaxed">
                Please read carefully before confirming.
              </p>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[18px] font-extrabold text-on-surface font-display mb-2">{title}</h3>
          <div className="text-[15px] text-on-surface-variant leading-relaxed">{description}</div>
        </div>

        <div className="flex gap-3 pt-2">
          {/* Cancel is prominent and easy to tap — users must be able to escape easily */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 min-h-[48px] px-5 py-3 rounded-xl font-bold text-[15px] border-2 border-outline-variant text-on-surface hover:bg-surface-container active:bg-surface-container-high transition-all disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={[
              'flex-1 min-h-[48px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-[15px] transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100',
              danger
                ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm'
                : 'bg-primary text-on-primary hover:bg-primary/90 active:bg-primary/75 shadow-sm',
            ].join(' ')}
          >
            {isLoading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
