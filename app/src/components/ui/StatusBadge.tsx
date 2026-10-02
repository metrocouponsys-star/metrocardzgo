import React from 'react';
import type { MemberStatus } from '../../types';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

const CONFIG: Record<MemberStatus, { label: string; classes: string; icon: string }> = {
  active:        { label: 'Active',        classes: 'bg-secondary-container text-on-secondary-container',    icon: 'check_circle' },
  expiring_soon: { label: 'Expiring Soon', classes: 'bg-tertiary-container text-on-tertiary-container',      icon: 'schedule' },
  expired:       { label: 'Expired',       classes: 'bg-error-container text-on-error-container',            icon: 'cancel' },
  deactivated:   { label: 'Inactive',      classes: 'bg-surface-container-high text-on-surface-variant',    icon: 'block' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { label, classes, icon } = CONFIG[status] ?? CONFIG.deactivated;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide ${classes} ${className}`}>
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      {label}
    </span>
  );
}

interface MembershipBadgeProps {
  name: string;
  className?: string;
}

// Generate a deterministic hue from a string for consistent badge colors
function stringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export function MembershipBadge({ name, className = '' }: MembershipBadgeProps) {
  const hue = stringToHue(name);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest ${className}`}
      style={{
        background: `hsl(${hue}, 70%, 90%)`,
        color: `hsl(${hue}, 60%, 30%)`,
      }}
    >
      {name}
    </span>
  );
}
