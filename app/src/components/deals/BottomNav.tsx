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
        <circle cx="11" cy="11" r="8" stroke={active ? '#D4AF37' : '#9CA3AF'} strokeWidth="1.5" />
        <path d="M11 7l1.2 3.5L16 11l-3.8 0.5L11 15l-1.2-3.5L6 11l3.8-0.5L11 7z"
          fill={active ? '#D4AF37' : 'none'} stroke={active ? '#D4AF37' : '#9CA3AF'} strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: 'live-offers',
    label: 'TOP DEALS',
    href: '/live-offers',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="16" height="12" rx="2" stroke={active ? '#D4AF37' : '#9CA3AF'} strokeWidth="1.5" />
        <path d="M7 9h8M7 13h5" stroke={active ? '#D4AF37' : '#9CA3AF'} strokeWidth="1.5" strokeLinecap="round" />
        {active && <circle cx="16" cy="6" r="3" fill="#E5C158" />}
      </svg>
    ),
  },
  {
    id: 'my-card',
    label: 'MY CARD',
    href: '/my-card',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="6" width="16" height="10" rx="2" stroke={active ? '#D4AF37' : '#9CA3AF'} strokeWidth="1.5" />
        <path d="M3 10h16" stroke={active ? '#D4AF37' : '#9CA3AF'} strokeWidth="1.5" />
        <circle cx="17" cy="15" r="1.5" fill={active ? '#D4AF37' : '#9CA3AF'} />
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
      style={{ background: '#14171F', borderTop: '1px solid #2A303C', boxShadow: '0 -4px 24px rgba(0,0,0,0.4)' }}
      aria-label="Customer navigation"
    >
      <ul className="flex items-center justify-around max-w-lg mx-auto px-2" style={{ height: '64px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/go'
              ? pathname === '/go' || pathname.startsWith('/category') || pathname.startsWith('/deal')
              : pathname.startsWith(item.href);

          return (
            <li key={item.id} className="flex-1">
              <Link
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 w-full h-16 transition-opacity active:opacity-70"
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon(isActive)}
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: isActive ? '#D4AF37' : '#6B7280', fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1 }}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0"
                    style={{ width: '24px', height: '2px', background: '#D4AF37', borderRadius: '2px 2px 0 0', boxShadow: '0 0 8px rgba(212,175,55,0.6)' }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
