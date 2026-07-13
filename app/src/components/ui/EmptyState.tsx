import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center space-y-4 animate-fade-in">
      <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">{icon}</span>
      </div>
      <div>
        <h4 className="text-headline-md font-headline-md text-on-surface mb-1">{title}</h4>
        <p className="text-body-md text-on-surface-variant max-w-xs">{description}</p>
      </div>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
