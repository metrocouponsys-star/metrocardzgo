import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
  iconColor?: string;
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

export function StatCard({ label, value, trend, trendUp, icon, iconColor = 'text-secondary', className = '', onClick }: StatCardProps) {
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

  return (
    <div
      onClick={onClick}
      className={`stat-card animate-slide-up group ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      } ${className}`}
    >
      {/* Header row: label + icon */}
      <div className="flex items-start justify-between">
        <p className="text-label-md font-label-md text-on-surface-variant leading-tight flex items-center gap-1.5">
          {label}
          {onClick && (
            <span className="material-symbols-outlined text-[13px] text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              arrow_outward
            </span>
          )}
        </p>
        {icon && (
          <div className="icon-container w-10 h-10 shrink-0 group-hover:scale-105 transition-transform">
            <span className={`material-symbols-outlined text-[20px] ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          </div>
        )}
      </div>

      {/* Big number */}
      <p className="text-[28px] leading-[34px] font-bold text-on-surface tabular-nums tracking-tight">
        {displayValue}
      </p>

      {/* Trend badge */}
      {trend && (
        <div className={`inline-flex items-center gap-1 text-label-sm px-2.5 py-1 rounded-lg w-fit font-medium
          ${trendUp === false
            ? 'text-error bg-error/8'
            : 'text-secondary bg-secondary/8'
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
