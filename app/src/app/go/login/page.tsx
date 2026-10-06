'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function GoLoginPage() {
  const [tab, setTab] = useState<'member' | 'admin'>('member');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FFFFFF',
        color: '#111827',
        fontFamily: '"Inter", system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F1F5F9',
        }}
      >
        <Link href="/go" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #FF8A3D 0%, #EA580C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
              boxShadow: '0 6px 14px rgba(234,88,12,0.2)',
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>Metro Cardz GO</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Deals Platform
            </div>
          </div>
        </Link>
        <Link
          href="/go"
          style={{
            fontSize: 13,
            color: '#6B7280',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to home
        </Link>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 20px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Page title */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em' }}>
              Access your account
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: '#6B7280' }}>
              Select how you want to continue
            </p>
          </div>

          {/* Tab switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              background: '#F9FAFB',
              borderRadius: 14,
              padding: 4,
              marginBottom: 24,
              border: '1px solid #F1F5F9',
            }}
          >
            {[
              { key: 'member', label: 'Member Access' },
              { key: 'admin', label: 'Admin Login' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key as 'member' | 'admin')}
                style={{
                  padding: '10px 16px',
                  borderRadius: 11,
                  border: 'none',
                  background: tab === t.key ? '#FFFFFF' : 'transparent',
                  color: tab === t.key ? '#111827' : '#9CA3AF',
                  fontSize: 13,
                  fontWeight: tab === t.key ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Member access panel */}
          {tab === 'member' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}
            >
              {/* Info banner */}
              <div
                style={{
                  background: '#FFF7ED',
                  border: '1px solid #FDE8CC',
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 22,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', marginBottom: 4 }}>
                  No separate GO password needed
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  Access your Metro Cardz GO membership benefits using your member code or registered mobile number.
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                {[
                  { icon: 'credit_card', text: 'View your digital membership card' },
                  { icon: 'stars', text: 'Check points balance and rewards' },
                  { icon: 'local_offer', text: 'Browse member-only deals and offers' },
                ].map((item) => (
                  <div
                    key={item.icon}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      background: '#F9FAFB',
                      borderRadius: 10,
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18, color: '#EA580C', flexShrink: 0, fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <Link href="/check-membership" style={{ textDecoration: 'none', display: 'block' }}>
                <button
                  style={{
                    width: '100%',
                    height: 50,
                    border: 'none',
                    background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                    color: '#fff',
                    borderRadius: 13,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 8px 20px rgba(234,88,12,0.2)',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                    qr_code_scanner
                  </span>
                  Look up my membership
                </button>
              </Link>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#9CA3AF' }}>
                You will need your member code or mobile number + last 4 digits to verify.
              </p>
            </div>
          )}

          {/* Admin login panel */}
          {tab === 'admin' && (
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: 20,
                padding: 28,
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              }}
            >
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 22,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: '#EF4444', flexShrink: 0, fontVariationSettings: "'FILL' 1" }}
                >
                  lock
                </span>
                <span style={{ fontSize: 13, color: '#7F1D1D', lineHeight: 1.5 }}>
                  This area is restricted to authorised Metro Cardz GO administrators only.
                </span>
              </div>

              <Link href="/admin/login" style={{ textDecoration: 'none', display: 'block' }}>
                <button
                  style={{
                    width: '100%',
                    height: 50,
                    border: '1.5px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#111827',
                    borderRadius: 13,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    admin_panel_settings
                  </span>
                  Continue to Admin Login
                </button>
              </Link>
            </div>
          )}

          {/* Footer */}
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#D1D5DB' }}>
            Metro Cardz GO Platform
          </p>
        </div>
      </main>
    </div>
  );
}
