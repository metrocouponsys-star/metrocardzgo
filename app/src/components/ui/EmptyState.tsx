import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'inventory_2', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      {/* Decorative circle with icon */}
      <div className="relative mb-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-accent text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        {/* Ambient glow */}
        <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl -z-10 scale-150 opacity-50" />
      </div>
      <h3 className="text-[18px] font-extrabold text-on-surface font-display mb-1.5">{title}</h3>
      {description && (
        <p className="text-[14px] text-on-surface-variant max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary flex items-center gap-2 mt-5"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
