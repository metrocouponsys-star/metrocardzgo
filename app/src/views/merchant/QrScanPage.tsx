'use client';
/**
 * QrScanPage — Merchant QR scanner view wrapper for the SPA.
 *
 * The actual scanner is implemented in /app/dashboard/scan/page.tsx (Next.js page).
 * This view re-implements the scanner inline to work inside react-router-dom (no useRouter).
 * Uses html5-qrcode (already in package.json).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface MemberInfo {
  id: string;
  memberCode: string;
  name: string;
  phone: string;
  status: string;
  loyaltyPoints: number;
  totalVisits: number;
  expiryDate: string;
  membershipTypeName?: string;
  offers?: Array<{ id: string; title: string; offerType: string; remainingQty?: number }>;
}

type ScanState = 'idle' | 'scanning' | 'found' | 'redeeming' | 'success' | 'error';

export default function QrScanPage() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOffer, setSelectedOffer] = useState('');
  const [amount, setAmount] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const scannerRef = useRef<any>(null);
  const html5QrRef = useRef<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        html5QrRef.current = Html5QrcodeScanner;
        setScannerReady(true);
      } catch {
        setErrorMsg('Camera library failed to load. Please reload.');
      }
    };
    load();
    return () => { stopScanner(); };
  }, []);

  function stopScanner() {
    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
    const el = document.getElementById('qr-reader');
    if (el) el.innerHTML = '';
  }

  const startScanner = useCallback(() => {
    if (!scannerReady || !html5QrRef.current) return;
    setScanState('scanning');
    setMember(null);
    setErrorMsg('');
    stopScanner();

    const scanner = new html5QrRef.current('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1,
      rememberLastUsedCamera: true,
    });

    scannerRef.current = scanner;
    scanner.render(
      async (decodedText: string) => {
        stopScanner();
        setScanState('found');
        await lookupMember(decodedText);
      },
      () => { /* scan fail — ignore */ }
    );
  }, [scannerReady, token]);

  async function lookupMember(tokenOrCode: string) {
    try {
      const res = await fetch(`/api/v1/members/by-token/${encodeURIComponent(tokenOrCode)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Member not found');
      }
      const data = await res.json();
      setMember(data);
      setScanState('found');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Scan failed');
      setScanState('error');
    }
  }

  async function handleRedeem() {
    if (!member) return;
    setScanState('redeeming');
    try {
      const res = await fetch('/api/v1/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: member.id,
          offerId: selectedOffer || undefined,
          amount: amount ? parseFloat(amount) : undefined,
          notes: 'QR scan redemption',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'Redemption failed');
      }
      const data = await res.json();
      setSuccessMsg(`✅ Redeemed! ${data.pointsAwarded ? `+${data.pointsAwarded} points awarded` : ''}`);
      setScanState('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Redemption failed');
      setScanState('error');
    }
  }

  const s = {
    container: {
      minHeight: '100dvh',
      background: '#F6F3EE',
      fontFamily: "'Plus Jakarta Sans','Inter',sans-serif",
      padding: '0',
    } as React.CSSProperties,
    header: {
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid #EAE3DD',
      padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: '12px',
    } as React.CSSProperties,
    backBtn: {
      background: '#FFF4EF', border: '1px solid #F8D7C0', borderRadius: '10px',
      color: '#C2410C', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
      padding: '8px 14px',
    } as React.CSSProperties,
    body: { padding: '24px 16px', maxWidth: '480px', margin: '0 auto' } as React.CSSProperties,
    card: {
      background: '#FFFFFF',
      border: '1px solid #EAE3DD',
      borderRadius: '20px', padding: '24px', marginBottom: '16px',
      boxShadow: '0 12px 24px rgba(17,24,39,0.05)',
    } as React.CSSProperties,
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigate('/portal/dashboard')}>← Back</button>
        <div>
          <h1 style={{ margin: 0, color: '#111827', fontSize: '18px', fontWeight: 800 }}>
            📷 QR Scanner
          </h1>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '12px' }}>
            Scan member QR to validate & redeem
          </p>
        </div>
      </div>

      <div style={s.body}>
        {/* Idle / Start */}
        {(scanState === 'idle' || scanState === 'error') && (
          <div style={s.card}>
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📷</div>
              <h2 style={{ color: '#111827', fontSize: '20px', fontWeight: 700, margin: '0 0 8px' }}>
                Ready to Scan
              </h2>
              <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
                Ask the customer to show their Metro Cardz QR code
              </p>
              {errorMsg && (
                <div style={{
                  background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
                  color: '#fca5a5', fontSize: '13px',
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              <button
                id="start-scan-btn"
                onClick={startScanner}
                disabled={!scannerReady}
                style={{
                  padding: '14px 32px', borderRadius: '14px', border: 'none',
                  background: !scannerReady ? '#FDBA74' : 'linear-gradient(135deg,#FF8A3D,#EA580C)',
                  color: '#fff',
                  fontSize: '16px', fontWeight: 700, cursor: !scannerReady ? 'not-allowed' : 'pointer',
                  boxShadow: scannerReady ? '0 8px 24px rgba(234,88,12,0.24)' : 'none',
                }}
              >
                {scannerReady ? '🔍 Start Scanning' : '⏳ Loading camera…'}
              </button>
            </div>
            <div id="qr-reader" style={{ marginTop: '16px' }} />
          </div>
        )}

        {/* Scanning */}
        {scanState === 'scanning' && (
          <div style={s.card}>
            <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#FFF7ED', padding: '8px 16px', borderRadius: '20px', border: '1px solid #FED7AA',
                marginBottom: '16px',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#EA580C', animation: 'pulse 1s infinite',
                }} />
                <span style={{ color: '#C2410C', fontSize: '13px', fontWeight: 700 }}>Scanning…</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '16px' }}>
                Point camera at the customer's QR code
              </p>
            </div>
            <div id="qr-reader" />
            <button
              onClick={() => { stopScanner(); setScanState('idle'); }}
              style={{
                marginTop: '16px', width: '100%', padding: '12px', borderRadius: '12px',
                background: '#fff', border: '1px solid #EAE3DD',
                color: '#4B5563', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Member Found */}
        {(scanState === 'found' || scanState === 'redeeming') && member && (
          <div>
            {/* Member card */}
            <div style={{
              ...s.card,
              border: member.status === 'active'
                ? '1px solid rgba(74,222,128,0.3)'
                : '1px solid rgba(248,113,113,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ color: '#111827', fontSize: '20px', fontWeight: 800, margin: '0 0 4px' }}>
                    {member.name}
                  </h2>
                  <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>
                    {member.memberCode} · {member.membershipTypeName ?? 'Standard'}
                  </p>
                </div>
                <span style={{
                  padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  background: member.status === 'active' ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
                  color: member.status === 'active' ? '#4ade80' : '#f87171',
                  border: `1px solid ${member.status === 'active' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
                }}>
                  {member.status === 'active' ? '✅ Active' : '❌ ' + member.status}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Points', value: member.loyaltyPoints.toLocaleString() },
                  { label: 'Visits', value: member.totalVisits },
                  { label: 'Expires', value: member.expiryDate ? new Date(member.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    background: '#F9F7F5', border: '1px solid #F1E7DF', borderRadius: '12px', padding: '10px',
                    textAlign: 'center',
                  }}>
                    <p style={{ margin: '0 0 2px', color: '#6B7280', fontSize: '11px', fontWeight: 600 }}>{label}</p>
                    <p style={{ margin: 0, color: '#111827', fontSize: '16px', fontWeight: 800 }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Offer selector */}
              {member.offers && member.offers.length > 0 && member.status === 'active' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', color: '#4B5563', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Select Offer (optional)
                  </label>
                  <select
                    id="offer-select"
                    value={selectedOffer}
                    onChange={e => setSelectedOffer(e.target.value)}
                    style={{
                      width: '100%', height: '44px', padding: '0 12px',
                      borderRadius: '10px', border: '1px solid #EAE3DD',
                      background: '#FFFFFF', color: '#111827', fontSize: '14px',
                    }}
                  >
                    <option value="">— No specific offer —</option>
                    {member.offers.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.title}{o.remainingQty !== undefined ? ` (${o.remainingQty} left)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#4B5563', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Bill Amount ₹ (optional)
                </label>
                <input
                  id="bill-amount"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter bill amount"
                  style={{
                    width: '100%', height: '44px', padding: '0 12px',
                    borderRadius: '10px', border: '1px solid #EAE3DD',
                    background: '#FFFFFF', color: '#111827',
                    fontSize: '15px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => { setScanState('idle'); setMember(null); }}
                  style={{
                    padding: '12px', borderRadius: '12px', border: '1px solid #EAE3DD',
                    background: '#fff', color: '#4B5563',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  ← Scan Again
                </button>
                <button
                  id="redeem-btn"
                  onClick={handleRedeem}
                  disabled={scanState === 'redeeming' || member.status !== 'active'}
                  style={{
                    padding: '12px', borderRadius: '12px', border: 'none',
                    background: member.status !== 'active'
                      ? 'rgba(248,113,113,0.3)'
                      : scanState === 'redeeming'
                      ? 'rgba(99,102,241,0.5)'
                      : 'linear-gradient(135deg,#FF8A3D,#EA580C)',
                    color: '#fff', fontSize: '14px', fontWeight: 700,
                    cursor: member.status !== 'active' || scanState === 'redeeming' ? 'not-allowed' : 'pointer',
                    boxShadow: member.status === 'active' && scanState !== 'redeeming' ? '0 4px 16px rgba(234,88,12,0.24)' : 'none',
                  }}
                >
                  {scanState === 'redeeming' ? '⏳ Processing…' : member.status !== 'active' ? '❌ Inactive' : '✅ Redeem'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {scanState === 'success' && (
          <div style={{ ...s.card, textAlign: 'center', borderColor: 'rgba(74,222,128,0.3)' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ color: '#4ade80', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
              Redemption Successful!
            </h2>
            <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
              {successMsg}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => { setScanState('idle'); setMember(null); setSuccessMsg(''); setSelectedOffer(''); setAmount(''); }}
                style={{
                  padding: '12px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg,#FF8A3D,#EA580C)',
                  color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(234,88,12,0.24)',
                }}
              >
                📷 Next Scan
              </button>
              <button
                onClick={() => navigate('/portal/dashboard')}
                style={{
                  padding: '12px', borderRadius: '12px', border: '1px solid #EAE3DD',
                  background: '#fff', color: '#4B5563',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
        input::placeholder { color: #9CA3AF; }
        input:focus, select:focus { outline: none; border-color: #FF6B35 !important; box-shadow: 0 0 0 3px rgba(255,107,53,0.12); }
        #qr-reader { border-radius: 16px; overflow: hidden; }
        #qr-reader video { border-radius: 16px; }
        #qr-reader__dashboard_section_swaplink { color: #C2410C !important; }
      `}</style>
    </div>
  );
}
