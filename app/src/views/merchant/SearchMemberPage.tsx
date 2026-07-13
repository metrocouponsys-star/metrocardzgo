import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import type { Member } from '../../types';
import * as api from '../../api';
import { StatusBadge, MembershipBadge } from '../../components/ui/StatusBadge';

const RECENT_KEY = 'mc_recent_searches';

function getRecentSearches(): Member[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch { return []; }
}
function addRecentSearch(member: Member) {
  const recent = getRecentSearches().filter(m => m.id !== member.id).slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify([member, ...recent]));
}

export default function SearchMemberPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'mobile' | 'membership' | 'qr' | 'card'>('mobile');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [recent, setRecent] = useState<Member[]>(getRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, [tab]);

  const performSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setNotFound(false);
    setResults([]);
    try {
      let found: Member[];
      if (tab === 'card') {
        // Search by 16-digit physical card number
        const m = await api.searchMemberByCard(user?.merchant_id || '', query);
        found = m ? [m] : [];
      } else {
        found = await api.searchMembers(user?.merchant_id || '', query);
      }
      if (found.length === 0) {
        setNotFound(true);
      } else if (found.length === 1) {
        addRecentSearch(found[0]);
        navigate(`/members/${found[0].id}`);
      } else {
        setResults(found);
      }
    } catch {
      setNotFound(true);
    } finally {
      setSearching(false);
    }
  };

  const goToMember = (member: Member) => {
    addRecentSearch(member);
    navigate(`/members/${member.id}`);
  };

  const TABS = [
    { key: 'mobile',     icon: 'smartphone',    label: 'Mobile No.' },
    { key: 'membership', icon: 'badge',          label: 'Member No.' },
    { key: 'card',       icon: 'credit_card',    label: 'Card No.' },
    { key: 'qr',         icon: 'qr_code_scanner', label: 'Scan QR' },
  ] as const;

  const PLACEHOLDERS = {
    mobile:     'e.g. +91 98765 43210',
    membership: 'e.g. SAL001',
    card:       'e.g. 4821 6739 0012 3847',
    qr:         '',
  };

  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-4xl mx-auto">
      <div className="page-header">
        <h2 className="page-title">Customer Lookup</h2>
        <p className="page-subtitle">Find a member to manage their benefits or process a redemption.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-md">
        {/* Search Card */}
        <div className="md:col-span-8 card overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-outline-variant/30">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setQuery(''); setResults([]); setNotFound(false); }}
                className={`flex-1 py-4 text-label-md font-label-md flex items-center justify-center gap-1.5 transition-all border-b-2
                  ${tab === t.key ? 'text-primary border-primary' : 'text-on-surface-variant border-transparent hover:bg-surface-container'}`}
              >
                <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="p-lg">
            {tab !== 'qr' ? (
              <div className="space-y-4">
                <div>
                  <label className="form-label">
                    {tab === 'mobile' ? 'Mobile Number' : tab === 'card' ? '16-Digit Card Number' : 'Membership Number'}
                  </label>
                  {tab === 'card' && (
                    <p className="text-label-sm text-on-surface-variant mb-2">Enter or scan the number printed on the physical membership card.</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type={tab === 'mobile' ? 'tel' : 'text'}
                      value={query}
                      onChange={e => { setQuery(e.target.value); setNotFound(false); setResults([]); }}
                      onKeyDown={e => e.key === 'Enter' && performSearch()}
                      placeholder={PLACEHOLDERS[tab]}
                      className="flex-1 h-14 bg-surface-container-low border border-outline-variant rounded-lg px-md text-headline-md focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      autoFocus
                    />
                    <button
                      onClick={performSearch}
                      disabled={searching || !query.trim()}
                      className="h-14 px-6 bg-primary text-on-primary rounded-lg font-label-md flex items-center gap-2 hover:bg-primary-container transition-colors disabled:opacity-50 active-scale"
                    >
                      {searching ? (
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined">search</span>
                      )}
                      Search
                    </button>
                  </div>
                </div>

                {/* Not Found */}
                {notFound && (
                  <div className="flex flex-col items-center py-8 text-center bg-error-container/10 rounded-xl border border-dashed border-error/30 animate-fade-in">
                    <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-on-error-container text-3xl">person_off</span>
                    </div>
                    <h3 className="text-headline-md text-on-surface mb-1">Member Not Found</h3>
                    <p className="text-body-md text-on-surface-variant mb-4">No member found for "{query}"</p>
                    <button onClick={() => navigate('/members/new')} className="btn-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      Add as New Member
                    </button>
                  </div>
                )}

                {/* Multiple Results */}
                {results.length > 1 && (
                  <div className="space-y-2 animate-fade-in">
                    <p className="text-label-md text-on-surface-variant font-bold">{results.length} members found</p>
                    {results.map(m => (
                      <MemberResultRow key={m.id} member={m} onClick={() => goToMember(m)} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <QrScannerView onScan={async (scannedValue) => {
                // QR on physical card encodes the 16-digit card number.
                // Try card number lookup first, then fall back to public_token lookup.
                try {
                  const byCard = await api.searchMemberByCard(user?.merchant_id || '', scannedValue);
                  if (byCard) {
                    addRecentSearch(byCard);
                    navigate(`/members/${byCard.id}`);
                    return;
                  }
                  // Fallback: treat scanned value as a public_token (digital QR cards)
                  const byToken = await api.getMemberByToken(scannedValue);
                  if (byToken) {
                    // getMemberByToken returns a public view — we need the internal member
                    // Search by the token itself through the members search endpoint
                    const results = await api.searchMembers(user?.merchant_id || '', scannedValue);
                    if (results.length > 0) {
                      addRecentSearch(results[0]);
                      navigate(`/members/${results[0].id}`);
                      return;
                    }
                  }
                  addToast('error', 'No member found for this QR code');
                } catch {
                  addToast('error', 'QR scan failed — please try manual search');
                }
              }} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-md">
          {/* Recent Searches */}
          <div className="bg-surface-container-high/50 rounded-xl p-md border border-outline-variant/20">
            <div className="flex items-center justify-between mb-md">
              <h3 className="text-label-md font-bold text-on-surface-variant uppercase tracking-wider">Recent Searches</h3>
              {recent.length > 0 && (
                <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }} className="text-label-sm text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="text-body-md text-on-surface-variant text-center py-4">No recent searches</p>
            ) : (
              <div className="space-y-1">
                {recent.map(m => (
                  <button
                    key={m.id}
                    onClick={() => goToMember(m)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container">
                      {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-bold text-on-surface truncate">{m.name}</p>
                      <p className="text-label-sm text-on-surface-variant truncate">{m.phone}</p>
                    </div>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Add */}
          <div className="bg-primary p-lg rounded-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-headline-md font-bold mb-1">New Member?</h4>
              <p className="text-label-sm opacity-80 mb-md">Enroll a customer and generate their membership card in seconds.</p>
              <button
                onClick={() => navigate('/members/new')}
                className="text-label-md bg-white text-primary px-4 py-2 rounded-lg font-bold hover:bg-primary-fixed transition-colors"
              >
                + Add Member
              </button>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-7xl opacity-10 rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button
        className="fixed right-6 bottom-24 md:bottom-10 md:right-10 w-14 h-14 bg-primary text-white rounded-2xl shadow-elevated flex items-center justify-center group active-scale transition-all z-40"
        onClick={() => navigate('/members/new')}
      >
        <span className="material-symbols-outlined text-3xl">person_add</span>
        <span className="absolute right-full mr-4 bg-primary px-3 py-1.5 rounded-lg text-label-md font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          New Member
        </span>
      </button>
    </div>
  );
}

function MemberResultRow({ member, onClick }: { member: Member; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all text-left border border-outline-variant/30"
    >
      <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center font-bold text-on-secondary-container">
        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-on-surface">{member.name}</p>
          {member.membership_type && <MembershipBadge name={member.membership_type.name} />}
        </div>
        <p className="text-label-sm text-on-surface-variant">{member.phone} · #{member.member_code}</p>
      </div>
      <StatusBadge status={member.status} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Real QR Scanner using html5-qrcode library
// Handles: camera permission, live scanning, cleanup on unmount/tab-switch
// ─────────────────────────────────────────────────────────────────────────────
type ScannerStatus = 'requesting' | 'active' | 'denied' | 'error';

function QrScannerView({ onScan }: { onScan: (token: string) => void }) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ScannerStatus>('requesting');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannedRef = useRef(false); // prevent double-fire on same QR

  const startScanner = useCallback(async () => {
    try {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      // Request camera permission explicitly first
      await navigator.mediaDevices.getUserMedia({ video: true });
      setStatus('active');

      const scannerId = 'mc-qr-scanner-region';
      const html5Qrcode = new Html5Qrcode(scannerId);
      scannerRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await html5Qrcode.start(
        { facingMode: 'environment' }, // Rear camera preferred
        config,
        (decodedText: string) => {
          // Prevent firing multiple times for the same QR frame
          if (scannedRef.current) return;
          scannedRef.current = true;
          setLastScanned(decodedText);
          onScan(decodedText);
          // Re-arm after 3 seconds in case navigation doesn't happen
          setTimeout(() => { scannedRef.current = false; }, 3000);
        },
        () => {
          // QR not found in frame — silent, expected
        },
      );
    } catch (err: any) {
      if (
        err?.name === 'NotAllowedError' ||
        err?.message?.includes('Permission') ||
        err?.message?.includes('denied')
      ) {
        setStatus('denied');
      } else {
        setStatus('error');
      }
    }
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        // State 2 = SCANNING
        if (state === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear?.();
      } catch {
        // ignore stop errors (already stopped)
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startScanner();
    return () => {
      // Cleanup: stop camera when leaving the QR tab or page
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  return (
    <div className="flex flex-col items-center py-4 w-full">
      {/* ── Requesting permission ─── */}
      {status === 'requesting' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[32px] animate-pulse">camera_alt</span>
          </div>
          <p className="text-body-md text-on-surface-variant text-center max-w-xs">
            Requesting camera access…
          </p>
        </div>
      )}

      {/* ── Camera active: scanner region ─── */}
      {status === 'active' && (
        <div className="w-full flex flex-col items-center gap-4">
          {/* html5-qrcode mounts the video feed into this div */}
          <div
            id="mc-qr-scanner-region"
            ref={containerRef}
            className="w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl"
          />
          {lastScanned && (
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
              <span className="material-symbols-outlined text-[14px] text-secondary">qr_code</span>
              Scanned — looking up member…
            </div>
          )}
          <p className="text-body-md text-on-surface-variant text-center max-w-xs">
            Point camera at the QR code on the member's card.
          </p>
        </div>
      )}

      {/* ── Camera permission denied ─── */}
      {status === 'denied' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-error-container text-[32px]">no_photography</span>
          </div>
          <div className="text-center">
            <p className="text-body-lg font-bold text-on-surface mb-1">Camera Access Denied</p>
            <p className="text-body-md text-on-surface-variant max-w-xs">
              Please allow camera access in your browser settings, then switch tabs and come back.
            </p>
          </div>
          <button
            onClick={() => { scannedRef.current = false; setStatus('requesting'); startScanner(); }}
            className="btn-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try Again
          </button>
          <p className="text-label-sm text-on-surface-variant">Or use the Mobile No. or Membership No. tab instead.</p>
        </div>
      )}

      {/* ── Generic error ─── */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="w-16 h-16 rounded-full bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-error-container text-[32px]">camera_off</span>
          </div>
          <div className="text-center">
            <p className="text-body-lg font-bold text-on-surface mb-1">Camera Unavailable</p>
            <p className="text-body-md text-on-surface-variant max-w-xs">
              Could not start the camera. This may happen on HTTP (non-HTTPS) connections.
            </p>
          </div>
          <button
            onClick={() => { scannedRef.current = false; setStatus('requesting'); startScanner(); }}
            className="btn-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
