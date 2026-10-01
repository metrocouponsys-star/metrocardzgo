'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

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

export default function QRScannerPage() {
  const router = useRouter();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOffer, setSelectedOffer] = useState('');
  const [amount, setAmount] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const scannerRef = useRef<any>(null);
  const html5QrRef = useRef<any>(null);

  // Load html5-qrcode dynamically (it's already in package.json)
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
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear?.().catch(() => {});
      }
    };
  }, []);

  const startScanner = useCallback(() => {
    if (!html5QrRef.current || !scannerReady) return;
    setScanState('scanning');
    setMember(null);
    setErrorMsg('');

    const scanner = new html5QrRef.current('qr-reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      rememberLastUsedCamera: true,
    }, false);

    scanner.render(
      async (decodedText: string) => {
        // Stop scanning immediately
        await scanner.clear().catch(() => {});
        setScanState('found');

        // Extract public_token from URL or use directly
        let token = decodedText.trim();
        try {
          const url = new URL(decodedText);
          const pathParts = url.pathname.split('/');
          token = pathParts[pathParts.length - 1] || token;
        } catch {
          // Not a URL, use raw value as token
        }

        await lookupMember(token);
      },
      (err: string) => {
        // Scanning errors are normal while searching — ignore
        if (!err.includes('No MultiFormat Readers')) {
          console.debug('QR scan attempt:', err);
        }
      }
    );

    scannerRef.current = scanner;
  }, [scannerReady]);

  const lookupMember = async (token: string) => {
    try {
      const res = await fetch(`/api/v1/members/by-token?token=${encodeURIComponent(token)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Member not found');
      }

      const data = await res.json();
      setMember(data);
      setScanState('found');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not find member. Check QR code and try again.');
      setScanState('error');
    }
  };

  const handleRedeem = async () => {
    if (!member || !selectedOffer) return;
    setScanState('redeeming');

    try {
      const res = await fetch('/api/v1/redemptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          member_id: member.id,
          offer_template_id: selectedOffer,
          amount: amount ? parseFloat(amount) : null,
        }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || 'Redemption failed');
      }

      const result = await res.json();
      setSuccessMsg(
        `✅ Redeemed! ${result.points_earned ? `+${result.points_earned} pts added.` : ''} Visit #${(member.totalVisits || 0) + 1}`
      );
      setScanState('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Redemption failed. Please try again.');
      setScanState('error');
    }
  };

  const reset = () => {
    setScanState('idle');
    setMember(null);
    setErrorMsg('');
    setSelectedOffer('');
    setAmount('');
    setSuccessMsg('');
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'expiring_soon': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'expired': return 'bg-red-500/20 text-red-300 border-red-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0f0c29, #302b63, #1a1a2e)' }}>
      {/* Header */}
      <header className="px-4 pt-8 pb-4">
        <button
          onClick={() => router.back()}
          className="text-white/60 text-sm flex items-center gap-1 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-extrabold text-white">Scan & Redeem</h1>
        <p className="text-white/50 text-sm mt-1">Scan member QR code to validate and redeem offers</p>
      </header>

      <div className="max-w-md mx-auto px-4 pb-10 space-y-4">

        {/* ── IDLE STATE ── */}
        {scanState === 'idle' && (
          <div className="text-center py-10 space-y-6">
            <div className="w-32 h-32 rounded-3xl flex items-center justify-center mx-auto text-6xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              📷
            </div>
            <div>
              <p className="text-white/70 text-sm mb-6">Position the member's QR code in the camera frame</p>
              <button
                onClick={startScanner}
                disabled={!scannerReady}
                className="w-full py-4 rounded-2xl font-bold text-lg transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}
              >
                {scannerReady ? '📷 Start Scanning' : 'Loading Camera…'}
              </button>
            </div>

            {/* Manual token entry */}
            <div className="pt-4 border-t border-white/10">
              <p className="text-white/40 text-xs mb-3">Or enter member code manually</p>
              <div className="flex gap-2">
                <input
                  id="manual-token"
                  type="text"
                  placeholder="Member code or token"
                  className="flex-1 bg-white/10 text-white placeholder-white/30 border border-white/15 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('manual-token') as HTMLInputElement;
                    if (input?.value) {
                      setScanState('found');
                      lookupMember(input.value.trim());
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SCANNING STATE ── */}
        {scanState === 'scanning' && (
          <div className="space-y-4">
            <div
              id="qr-reader"
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.15)' }}
            />
            <p className="text-center text-white/60 text-sm animate-pulse">
              Scanning… point camera at the QR code
            </p>
            <button
              onClick={() => { scannerRef.current?.clear?.().catch(() => {}); reset(); }}
              className="w-full py-3 rounded-xl text-sm font-bold text-white/60 hover:text-white transition"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── FOUND STATE ── */}
        {scanState === 'found' && member && (
          <div className="space-y-4">
            {/* Member Card */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">{member.name}</h2>
                  <p className="text-white/50 text-sm">{member.memberCode}</p>
                  {member.membershipTypeName && (
                    <p className="text-white/40 text-xs mt-0.5">{member.membershipTypeName}</p>
                  )}
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusColor(member.status)}`}>
                  {member.status === 'active' ? '✓ Active' :
                   member.status === 'expiring_soon' ? '⚠ Expiring' :
                   member.status === 'expired' ? '✗ Expired' : member.status}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-white/40">Points</p>
                  <p className="text-lg font-bold text-white">{member.loyaltyPoints.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-white/40">Visits</p>
                  <p className="text-lg font-bold text-white">{member.totalVisits}</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${member.status === 'expired' ? 'bg-red-500/20' : 'bg-white/5'}`}>
                  <p className="text-xs text-white/40">Expires</p>
                  <p className="text-sm font-bold text-white">
                    {new Date(member.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Offer Selection */}
            {member.status !== 'expired' && member.offers && member.offers.length > 0 && (
              <div className="rounded-2xl p-4 space-y-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 className="text-sm font-bold text-white/70">Select Offer to Redeem</h3>
                <div className="space-y-2">
                  {member.offers.map(offer => (
                    <label key={offer.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition
                        ${selectedOffer === offer.id ? 'bg-indigo-500/20 border border-indigo-400/30' : 'bg-white/5 border border-transparent hover:bg-white/10'}`}>
                      <input
                        type="radio"
                        name="offer"
                        value={offer.id}
                        checked={selectedOffer === offer.id}
                        onChange={() => setSelectedOffer(offer.id)}
                        className="accent-indigo-400"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{offer.title}</p>
                        {offer.remainingQty != null && (
                          <p className="text-xs text-white/40">{offer.remainingQty} remaining</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

                {/* Optional amount */}
                <input
                  type="number"
                  placeholder="Bill amount (optional)"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-white/10 text-white placeholder-white/30 border border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-white/30"
                />
              </div>
            )}

            {/* Expired Warning */}
            {member.status === 'expired' && (
              <div className="rounded-2xl p-4 bg-red-500/15 border border-red-400/20">
                <p className="text-red-300 font-bold text-sm">⚠️ Membership Expired</p>
                <p className="text-red-300/70 text-xs mt-1">This membership has expired. Cannot redeem offers.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white/60"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                Scan Again
              </button>
              {member.status !== 'expired' && (
                <button
                  onClick={handleRedeem}
                  disabled={!selectedOffer}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  ✓ Redeem
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── REDEEMING STATE ── */}
        {scanState === 'redeeming' && (
          <div className="text-center py-16 space-y-4">
            <div className="text-5xl animate-spin">⚙️</div>
            <p className="text-white font-bold">Processing redemption…</p>
          </div>
        )}

        {/* ── SUCCESS STATE ── */}
        {scanState === 'success' && (
          <div className="text-center py-10 space-y-5">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto text-5xl"
              style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' }}>
              ✅
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">Redeemed!</h2>
              <p className="text-emerald-300 mt-2 text-sm">{successMsg}</p>
            </div>
            <button
              onClick={reset}
              className="w-full py-4 rounded-2xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Scan Next Customer
            </button>
          </div>
        )}

        {/* ── ERROR STATE ── */}
        {scanState === 'error' && (
          <div className="text-center py-10 space-y-5">
            <div className="text-5xl">❌</div>
            <div>
              <h2 className="text-xl font-bold text-white">Failed</h2>
              <p className="text-red-300 mt-2 text-sm">{errorMsg}</p>
            </div>
            <button
              onClick={reset}
              className="w-full py-4 rounded-2xl font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
