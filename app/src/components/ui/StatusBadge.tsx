import React from 'react';
import type { MemberStatus } from '../../types';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

// ── PREMIUM soft-tint pill badges ─────────────────────────────────────────────
// Each badge uses a light tinted background with dark contrasting text.
// This soft-tint style is the modern SaaS premium signal vs heavy solid fills.
const CONFIG: Record<MemberStatus, { label: string; className: string; icon: string }> = {
  active:       { label: 'Active',        className: 'bg-emerald-50 text-emerald-700',   icon: 'check_circle' },
  expiring_soon:{ label: 'Expiring Soon', className: 'bg-amber-50 text-amber-700',       icon: 'schedule' },
  expired:      { label: 'Expired',       className: 'bg-red-50 text-red-600',           icon: 'cancel' },
  deactivated:  { label: 'Inactive',      className: 'bg-[#F3F4F6] text-[#6B7280]',     icon: 'block' },
};


export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { label, className: cls, icon } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cls} ${className}`}>
      <span className="material-symbols-outlined text-[11px]">{icon}</span>
      {label}
    </span>
  );
}

interface MembershipBadgeProps {
  name: string;
  className?: string;
}

export function MembershipBadge({ name, className = '' }: MembershipBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F5EDD0] text-[#7A5C12] uppercase tracking-wider ${className}`}>
      {name}
    </span>
  );
}
