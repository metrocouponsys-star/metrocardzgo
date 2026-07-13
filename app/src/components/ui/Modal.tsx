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
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal */}
      <div className={`relative w-full ${maxWidth} bg-surface-container-lowest rounded-2xl shadow-2xl animate-scale-in`}>
        {title && (
          <div className="flex items-center justify-between px-lg py-md border-b border-outline-variant/30">
            <h3 className="text-headline-md font-headline-md text-on-surface">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        )}
        <div className="p-lg">{children}</div>
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
      <div className="flex flex-col gap-lg">
        <div>
          <h3 className="text-headline-md font-headline-md text-on-surface mb-2">{title}</h3>
          <div className="text-body-lg text-on-surface-variant">{description}</div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={isLoading}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-headline-md text-headline-md transition-colors active-scale disabled:opacity-50
              ${danger ? 'bg-error text-on-error hover:bg-on-error-container' : 'bg-primary text-on-primary hover:bg-primary-container'}
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
