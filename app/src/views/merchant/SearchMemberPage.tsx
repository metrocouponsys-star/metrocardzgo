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
                try {
                  // QR encodes: https://metrocardz.in/m/{public_token}
                  // Extract the token from the URL; fall back to treating the
                  // raw value as a card number if it doesn't look like our URL.
                  const urlMatch = scannedValue.match(/\/m\/([^/?#]+)/);
                  const publicToken = urlMatch ? urlMatch[1] : null;

                  if (publicToken) {
                    // Primary path: resolve by public token
                    const byToken = await api.getMemberByToken(publicToken);
                    if (byToken) {
                      navigate(`/members/${byToken.member_id}`);
                      return;
                    }
                  } else {
                    // Fallback: treat raw value as a card number
                    const byCard = await api.searchMemberByCard(user?.merchant_id || '', scannedValue);
                    if (byCard) {
                      addRecentSearch(byCard);
                      navigate(`/members/${byCard.id}`);
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
// QR Scanner — html5-qrcode backed, with image-upload fallback
//
// KEY FIX: The #mc-qr-scanner-region div must ALWAYS exist in the DOM before
// new Html5Qrcode(id) is called. Conditionally rendering the div (only when
// status==='active') means it doesn't exist when startScanner() runs because
// React hasn't re-rendered yet → html5-qrcode throws, falls to generic error.
// Solution: always render the div, toggle visibility via CSS only.
//
// CASCADE (most reliable → least):
//   1. getCameras() device ID — most reliable on desktop/laptop
//   2. facingMode: { ideal: 'environment' } — rear camera / mobile
//   3. facingMode: 'user' — front camera / webcam fallback
// ─────────────────────────────────────────────────────────────────────────────
type ScannerStatus = 'requesting' | 'active' | 'denied' | 'error';

function QrScannerView({ onScan }: { onScan: (token: string) => void }) {
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileTempRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<ScannerStatus>('requesting');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [activeCamIndex, setActiveCamIndex] = useState(0);
  const [fileScanning, setFileScanning] = useState(false);
  const scannedRef = useRef(false);

  // Stable callback ref — scanner never re-mounts on parent re-renders
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // ── Stop & clean up ────────────────────────────────────────────────────────
  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const state = scannerRef.current.getState?.();
      if (state === 2) await scannerRef.current.stop(); // 2 = SCANNING
      scannerRef.current.clear?.();
    } catch { /* ignore */ }
    scannerRef.current = null;
  }, []);

  // ── Start with a specific constraint/deviceId ──────────────────────────────
  // IMPORTANT: #mc-qr-scanner-region MUST already be in the DOM here.
  const startWithConstraint = useCallback(async (constraint: any) => {
    const { Html5Qrcode } = await import('html5-qrcode');
    await stopScanner();
    const el = document.getElementById('mc-qr-scanner-region');
    if (el) el.innerHTML = '';
    const scanner = new Html5Qrcode('mc-qr-scanner-region');
    scannerRef.current = scanner;
    const onDecoded = (text: string) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      setLastScanned(text);
      onScanRef.current(text);
      setTimeout(() => { scannedRef.current = false; }, 3000);
    };
    await scanner.start(
      constraint,
      { fps: 10, qrbox: { width: 200, height: 200 } },
      onDecoded,
      () => { /* silent — no QR in frame */ },
    );
  }, [stopScanner]);

  // ── Main cascade start ─────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    await stopScanner();
    scannedRef.current = false;
    setLastScanned(null);
    setStatus('requesting');

    if (typeof navigator === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setStatus('error');
      return;
    }

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      // Enumerate cameras — works on desktop once permission is granted
      let deviceList: { id: string; label: string }[] = [];
      try {
        deviceList = await Html5Qrcode.getCameras();
        if (deviceList?.length > 0) setCameras(deviceList);
      } catch { /* may fail before permission */ }

      // Attempt 1: real device ID (most compatible on desktop/laptop)
      if (deviceList.length > 0) {
        try {
          await startWithConstraint(deviceList[deviceList.length - 1].id);
          setStatus('active');
          return;
        } catch (e) {
          console.warn('[QR] deviceId failed, trying facingMode:', e);
          await stopScanner();
        }
      }

      // Attempt 2: environment (rear / mobile)
      try {
        await startWithConstraint({ facingMode: { ideal: 'environment' } });
        setStatus('active');
        return;
      } catch (e) {
        console.warn('[QR] environment failed, trying user:', e);
        await stopScanner();
      }

      // Attempt 3: user (front / webcam)
      try {
        await startWithConstraint({ facingMode: 'user' });
        setStatus('active');
        return;
      } catch (e) {
        console.warn('[QR] All camera attempts exhausted:', e);
        await stopScanner();
      }

      setStatus('error');
    } catch (err: any) {
      await stopScanner();
      const msg = (err?.message ?? '').toLowerCase();
      const name = err?.name ?? '';
      if (name === 'NotAllowedError' || msg.includes('denied') || msg.includes('permission') || msg.includes('not allowed')) {
        setStatus('denied');
      } else {
        setStatus('error');
      }
    }
  }, [stopScanner, startWithConstraint]);

  // ── Switch camera ──────────────────────────────────────────────────────────
  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    const next = (activeCamIndex + 1) % cameras.length;
    setActiveCamIndex(next);
    setStatus('requesting');
    try {
      await startWithConstraint(cameras[next].id);
      setStatus('active');
    } catch {
      setStatus('error');
    }
  }, [cameras, activeCamIndex, startWithConstraint]);

  // ── Upload a QR image and decode it ───────────────────────────────────────
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempEl = fileTempRef.current;
      if (!tempEl) { alert('Scanner not ready, please try again.'); return; }
      tempEl.innerHTML = '';
      const decoder = new Html5Qrcode(tempEl.id);
      const text = await decoder.scanFile(file, true);
      try { decoder.clear(); } catch { /* ok */ }
      setLastScanned(text);
      onScanRef.current(text);
    } catch {
      alert('No QR code detected in the selected image. Please try a clearer photo of the QR code.');
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  // ── Mount: 50ms delay so React paints the DOM first ───────────────────────
  useEffect(() => {
    const t = setTimeout(() => { startScanner(); }, 50);
    return () => { clearTimeout(t); stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHTTPS = typeof window !== 'undefined' &&
    (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  const showVideoPanel = status === 'active' || status === 'requesting';

  return (
    <div className="flex flex-col items-center py-2 w-full gap-4">
      {/* Always-present inputs — NEVER conditionally rendered */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
      <div id="mc-qr-temp-decoder" ref={fileTempRef} className="hidden" />

      {/* ── Non-HTTPS warning ─── */}
      {!isHTTPS && (
        <div className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-label-sm">
          <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">warning</span>
          Camera scanning requires HTTPS. This page is on HTTP — live scanning may not work.
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          VIDEO PANEL — ALWAYS in DOM so html5-qrcode can always find the div.
          Hidden via CSS (not conditional JSX) when not in requesting/active.
      ──────────────────────────────────────────────────────────────────────── */}
      <div className={`w-full flex flex-col items-center gap-3 ${!showVideoPanel ? 'hidden' : ''}`}>
        {status === 'requesting' && (
          <div className="flex flex-col items-center gap-3 py-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-primary-container/30 flex items-center justify-center relative">
              <span className="material-symbols-outlined text-primary text-[28px]">camera_alt</span>
              <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
            </div>
            <p className="text-sm text-on-surface-variant text-center max-w-xs">
              Starting camera… allow access when prompted.
            </p>
          </div>
        )}

        {/* The scanner div — always rendered, invisible during 'requesting' */}
        <div className={`relative w-full max-w-[320px] ${status === 'requesting' ? 'invisible h-0 overflow-hidden' : ''}`}>
          <div
            id="mc-qr-scanner-region"
            className="w-full rounded-2xl overflow-hidden shadow-2xl bg-black min-h-[260px]"
          />
          {status === 'active' && (
            <div className="absolute inset-0 pointer-events-none rounded-2xl">
              <div className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-primary rounded-br-lg" />
              <div className="scanner-line" />
            </div>
          )}
        </div>

        {/* Camera controls (active only) */}
        {status === 'active' && (
          <div className="flex items-center gap-2 flex-wrap justify-center animate-fade-in">
            {cameras.length > 1 && (
              <button onClick={switchCamera} className="btn-secondary text-label-sm py-1.5 px-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">cameraswitch</span>
                Switch Camera
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileScanning}
              className="btn-outline text-label-sm py-1.5 px-3 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">image</span>
              {fileScanning ? 'Reading…' : 'Upload QR Image'}
            </button>
          </div>
        )}

        {status === 'active' && (
          lastScanned ? (
            <div className="flex items-center gap-2 text-label-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-full animate-fade-in">
              <span className="material-symbols-outlined text-[14px]">qr_code</span>
              QR detected — looking up member…
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant text-center max-w-xs">
              Point camera at the QR code on the member's card.
            </p>
          )
        )}
      </div>

      {/* ── Permission denied ─── */}
      {status === 'denied' && (
        <div className="flex flex-col items-center gap-4 py-4 animate-fade-in w-full">
          <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-error-container text-[28px]">no_photography</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-on-surface mb-1">Camera Access Denied</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Your browser blocked the camera. Upload a QR photo, or allow camera access.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button onClick={() => fileInputRef.current?.click()} disabled={fileScanning} className="btn-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              {fileScanning ? 'Reading…' : 'Upload QR Photo'}
            </button>
            <button onClick={startScanner} className="btn-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Try Camera
            </button>
          </div>
          <div className="w-full max-w-sm bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant text-left space-y-1">
            <p className="font-bold text-on-surface flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-[14px] text-primary">help_outline</span>
              Allow camera in Chrome:
            </p>
            <p>① Click the 🔒 icon in the address bar</p>
            <p>② Site settings → Camera → Allow</p>
            <p>③ Refresh and try again</p>
          </div>
        </div>
      )}

      {/* ── Camera error — offer image upload ─── */}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-4 animate-fade-in w-full">
          <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant text-[28px]">videocam_off</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-on-surface mb-1">Live Camera Unavailable</p>
            <p className="text-sm text-on-surface-variant max-w-xs">
              Could not start the camera stream. Take a photo of the QR code and upload it below — it works the same way!
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button
              onClick={() => cameraInputRef.current?.click()}
              disabled={fileScanning}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              {fileScanning ? 'Scanning Photo…' : '📷 Take Photo of QR Code'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={fileScanning}
              className="btn-outline w-full py-2 flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">image</span>
              Upload QR Image from Gallery
            </button>
            <button onClick={startScanner} className="btn-outline w-full py-2 flex items-center justify-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retry Live Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
