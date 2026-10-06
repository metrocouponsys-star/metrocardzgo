'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// NOTE: Admin is intentionally NOT in this nav.
// Admin access is ONLY via /admin/login — never shown to customers.
const NAV_ITEMS = [
  {
    id: 'explore',
    label: 'EXPLORE',
    href: '/go',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke={active ? '#B45309' : '#9CA3AF'} strokeWidth="1.5" />
        <path d="M11 7l1.2 3.5L16 11l-3.8 0.5L11 15l-1.2-3.5L6 11l3.8-0.5L11 7z"
          fill={active ? '#B45309' : 'none'} stroke={active ? '#B45309' : '#9CA3AF'} strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'live-offers',
    label: 'TOP DEALS',
    href: '/live-offers',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke={active ? '#B45309' : '#9CA3AF'} strokeWidth="1.5" />
        <path d="M7 9h8M7 13h5" stroke={active ? '#B45309' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" />
        {active && <circle cx="16" cy="6" r="3" fill="#C59B27" />}
      </svg>
    ),
  },
  {
    id: 'my-card',
    label: 'MY CARD',
    href: '/my-card',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="16" height="10" rx="2" stroke={active ? '#B45309' : '#9CA3AF'} strokeWidth="1.5" />
        <path d="M3 10h16" stroke={active ? '#B45309' : '#9CA3AF'} strokeWidth="1.5" />
        <circle cx="17" cy="15" r="1.5" fill={active ? '#B45309' : '#9CA3AF'} />
      </svg>
    ),
  },
];

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className = '' }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 safe-area-inset-bottom ${className}`}
      style={{
        background:  '#FFFFFF',
        borderTop:   '1px solid #E5E7EB',
        boxShadow:   '0 -4px 20px rgba(0,0,0,0.04)',
      }}
      aria-label="Customer navigation"
    >
      <ul className="flex items-center justify-around max-w-lg mx-auto px-2" style={{ height: '64px' }}>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                style={{
                  display:        'flex',
                  flexDirection:  'column',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '3px',
                  padding:        '6px 16px',
                  borderRadius:   '10px',
                  textDecoration: 'none',
                  transition:     'background 0.15s',
                  background:     active ? '#FEF3C7' : 'transparent',
                }}
              >
                {item.icon(active)}
                <span
                  style={{
                    fontSize:      '9px',
                    fontWeight:    active ? 700 : 500,
                    letterSpacing: '0.08em',
                    color:         active ? '#B45309' : '#9CA3AF',
                    fontFamily:    '"Inter", sans-serif',
                    lineHeight:    '12px',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
