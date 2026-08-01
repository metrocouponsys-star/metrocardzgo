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

export function StatCard({ label, value, trend, trendUp, icon, iconColor = 'text-[#B8941F]', className = '', onClick }: StatCardProps) {
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
      className={`stat-card animate-slide-up group transition-all ${
        onClick ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.98]' : 'hover:-translate-y-0.5'
      } ${className}`}
    >
      {/* Label row with optional icon */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-xs font-semibold tracking-widest uppercase text-[#9CA3AF] leading-tight">
          {label}
          {onClick && (
            <span className="material-symbols-outlined text-[12px] text-[#B8941F] opacity-0 group-hover:opacity-100 transition-opacity ml-1">
              arrow_forward
            </span>
          )}
        </p>
        {icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 group-hover:scale-110 transition-transform shrink-0">
            <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>{icon}</span>
          </div>
        )}
      </div>

      {/* ── The number — DOMINANT visual element ──────────────────────────── */}
      <p className="text-[40px] leading-[48px] font-extrabold text-[#111111] tabular-nums tracking-tight">
        {displayValue}
      </p>

      {/* Trend badge — soft-tint pill */}
      {trend && (
        <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full w-fit mt-1
          ${trendUp === false
            ? 'text-red-600 bg-red-50'
            : trendUp === true
              ? 'text-emerald-700 bg-emerald-50'
              : 'text-[#6B7280] bg-[#F3F4F6]'
          }`}>
          <span className="material-symbols-outlined text-[12px]">
            {trendUp === false ? 'trending_down' : trendUp === true ? 'trending_up' : 'info'}
          </span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

