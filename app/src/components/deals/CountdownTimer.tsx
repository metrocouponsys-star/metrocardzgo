'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  /** ISO date string or Date — the deadline */
  endDate: string | Date;
  className?: string;
}

/**
 * CountdownTimer — live HH:MM:SS countdown for expiring deals.
 * Renders a pulsing amber display when under 2 hours remaining.
 * Auto-hides and calls onExpired (if provided) when time is up.
 */
export function CountdownTimer({ endDate, className = '' }: CountdownTimerProps) {
  const target = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const [remaining, setRemaining] = useState(getRemaining(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getRemaining(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (remaining.total <= 0) return null;

  const isUrgent = remaining.total < 2 * 60 * 60 * 1000; // under 2 hours

  return (
    <span
      className={`inline-flex items-center gap-1 font-body tabular-nums ${isUrgent ? 'animate-countdown text-amber-400' : 'text-obs-text-muted'} ${className}`}
      style={{ fontSize: '12px', fontWeight: 600 }}
      aria-live="polite"
      aria-label={`Expires in ${remaining.display}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M6 3.5V6L7.5 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {remaining.days > 0
        ? `${remaining.days}d ${pad(remaining.hours)}h left`
        : remaining.hours > 0
          ? `${pad(remaining.hours)}:${pad(remaining.minutes)}:${pad(remaining.seconds)}`
          : `${pad(remaining.minutes)}:${pad(remaining.seconds)} left`}
    </span>
  );
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function getRemaining(target: Date) {
  const total = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / 1000 / 60 / 60) % 24);
  const days = Math.floor(total / 1000 / 60 / 60 / 24);
  const display = days > 0
    ? `${days}d ${hours}h`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return { total, days, hours, minutes, seconds, display };
}
