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
      {/* Backdrop — slightly darker for premium contrast */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Modal container — pure white, premium shadow lifts it clearly above backdrop */}
      <div className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-modal animate-scale-in overflow-hidden`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F3F4F6]">
            <h3 className="text-lg font-bold text-[#111111]">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F3F4F6] transition-colors text-[#6B7280] hover:text-[#111111]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
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
      <div className="flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-bold text-[#111111] mb-2">{title}</h3>
          <div className="text-sm text-[#6B7280] leading-relaxed">{description}</div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] disabled:opacity-50
              ${danger
                ? 'bg-red-600 text-white hover:bg-[#9B1313] shadow-sm hover:shadow'
                : 'bg-[#B8941F] text-white hover:bg-[#9A7A18] shadow-sm hover:shadow-[0_4px_12px_rgba(184,148,31,0.3)]'
              }`}
          >
            {isLoading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

