import React from 'react';
import type { MemberStatus } from '../../types';

interface StatusBadgeProps {
  status: MemberStatus;
  className?: string;
}

const CONFIG: Record<MemberStatus, { label: string; className: string; icon: string }> = {
  active: { label: 'Active', className: 'bg-secondary-container text-secondary', icon: 'check_circle' },
  expiring_soon: { label: 'Expiring Soon', className: 'bg-amber-100 text-amber-600', icon: 'schedule' },
  expired: { label: 'Expired', className: 'bg-error-container text-on-error-container', icon: 'cancel' },
  deactivated: { label: 'Inactive', className: 'bg-surface-container text-on-surface-variant', icon: 'block' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { label, className: cls, icon } = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm ${cls} ${className}`}>
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-bold bg-secondary text-on-secondary uppercase tracking-wider ${className}`}>
      {name}
    </span>
  );
}
