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
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`relative w-full ${maxWidth} max-h-[85vh] md:max-h-[90vh] bg-white rounded-2xl shadow-dialog animate-scale-in flex flex-col my-auto overflow-hidden border border-outline-variant/30`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 shrink-0">
            <h3 className="text-[18px] font-extrabold text-on-surface font-display">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">close</span>
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
  isLoading?: boolean;
  danger?: boolean;
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm', isLoading, danger }: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-[18px] font-extrabold text-on-surface font-display mb-2">{title}</h3>
          <div className="text-[15px] text-on-surface-variant leading-relaxed">{description}</div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[14px] transition-all active-scale disabled:opacity-50
              ${danger
                ? 'bg-gradient-to-r from-error to-red-600 text-white shadow-sm hover:shadow-md'
                : 'btn-primary'
              }
            `}
          >
            {isLoading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
