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
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-5 animate-fade-in">
      {/* Icon container — soft gold tint gradient, generous sizing */}
      <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #FBF7EA 0%, #F5EDD0 100%)' }}>
        <span className="material-symbols-outlined text-[48px] text-[#B8941F]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48" }}>
          {icon}
        </span>
      </div>

      {/* Text */}
      <div className="space-y-2 max-w-xs">
        <h4 className="text-xl font-bold text-[#111111]">{title}</h4>
        <p className="text-sm text-[#6B7280] leading-relaxed">{description}</p>
      </div>

      {/* CTA */}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
