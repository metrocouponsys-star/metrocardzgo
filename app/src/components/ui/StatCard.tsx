import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: string;
  iconColor?: string;
  className?: string;
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

export function StatCard({ label, value, trend, trendUp, icon, iconColor = 'text-secondary', className = '' }: StatCardProps) {
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
    <div className={`stat-card animate-slide-up group hover:shadow-md transition-all hover:-translate-y-0.5 ${className}`}>
      <div className="flex items-start justify-between">
        <p className="text-label-md font-label-md text-on-surface-variant leading-tight">{label}</p>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container group-hover:scale-110 transition-transform ${iconColor.replace('text-', 'bg-').replace(/text-\w+/, '')} `}>
            <span className={`material-symbols-outlined text-[18px] ${iconColor}`}>{icon}</span>
          </div>
        )}
      </div>
      <p className="text-headline-lg-mobile font-headline-lg text-primary tabular-nums">{displayValue}</p>
      {trend && (
        <div className={`inline-flex items-center gap-1 text-label-sm px-2 py-0.5 rounded-full w-fit
          ${trendUp === false
            ? 'text-error bg-error/10'
            : 'text-secondary bg-secondary/10'
          }`}>
          <span className="material-symbols-outlined text-[13px]">
            {trendUp === false ? 'trending_down' : 'trending_up'}
          </span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
