import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({ label, value, trend, trendUp, icon, iconColor = 'text-secondary', className = '' }: StatCardProps) {
  return (
    <div className={`stat-card animate-slide-up ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-label-md font-label-md text-on-surface-variant">{label}</p>
        {icon && (
          <span className={`material-symbols-outlined text-[20px] ${iconColor}`}>{icon}</span>
        )}
      </div>
      <p className="text-headline-lg-mobile font-headline-lg text-primary">{value}</p>
      {trend && (
        <div className={`flex items-center gap-1 text-label-sm ${trendUp === false ? 'text-error' : 'text-secondary'}`}>
          <span className="material-symbols-outlined text-[14px]">
            {trendUp === false ? 'trending_down' : 'trending_up'}
          </span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
