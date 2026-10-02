import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
  iconColor?: string;
  variant?: 'accent' | 'teal' | 'amber' | 'navy';
  className?: string;
  onClick?: () => void;
}

/** Animate a numeric value from 0 → target over `duration` ms */
function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(ease * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return current;
}

const VARIANT_COLORS = {
  accent: {
    card: 'stat-card',
    icon: 'bg-gradient-to-br from-accent/15 to-accent/5 text-accent',
    text: 'text-accent',
  },
  teal: {
    card: 'stat-card stat-card--teal',
    icon: 'bg-gradient-to-br from-secondary/15 to-secondary/5 text-secondary',
    text: 'text-secondary',
  },
  amber: {
    card: 'stat-card stat-card--amber',
    icon: 'bg-gradient-to-br from-tertiary/15 to-tertiary/5 text-tertiary',
    text: 'text-tertiary',
  },
  navy: {
    card: 'stat-card stat-card--navy',
    icon: 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
    text: 'text-primary',
  },
};

export function StatCard({ label, value, trend, trendUp, icon, iconColor, variant = 'accent', className = '', onClick }: StatCardProps) {
  // Extract numeric value if value is a string with a number prefix
  const numericMatch = typeof value === 'string' ? value.match(/^([\d.,]+)(.*)$/) : null;
  const rawNumber = typeof value === 'number' ? value : numericMatch ? parseFloat(numericMatch[1].replace(/,/g, '')) : null;
  const suffix = numericMatch ? numericMatch[2] : '';

  const animated = useCountUp(rawNumber ?? 0);

  const displayValue = rawNumber !== null
    ? typeof value === 'number'
      ? animated.toLocaleString()
      : `${animated.toLocaleString()}${suffix}`
    : value;

  const colors = VARIANT_COLORS[variant];

  return (
    <div
      onClick={onClick}
      className={`${colors.card} animate-slide-up group ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-semibold text-on-surface-variant leading-tight flex items-center gap-1.5 uppercase tracking-wide">
          {label}
          {onClick && (
            <span className="material-symbols-outlined text-[13px] text-accent/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              arrow_outward
            </span>
          )}
        </p>
        {icon && (
          <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
            <span className={`material-symbols-outlined text-[20px]`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
        )}
      </div>

      {/* Big number */}
      <p className="text-[28px] leading-[34px] font-extrabold text-on-surface tabular-nums tracking-tight font-display">
        {displayValue}
      </p>

      {/* Trend badge */}
      {trend && (
        <div className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg w-fit font-semibold
          ${trendUp === false
            ? 'text-error bg-error-container'
            : `${colors.text} bg-secondary-container/50`
          }`}>
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {trendUp === false ? 'trending_down' : 'trending_up'}
          </span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
