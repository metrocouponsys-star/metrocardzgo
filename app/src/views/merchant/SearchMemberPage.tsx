import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg: '#F8FAFC', white: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', textMuted: '#64748B', textLight: '#94A3B8',
  orange: '#FF6B35', orangeLight: '#FFF4EF', orangeDark: '#E85A28',
  shadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
};

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'mobile',     icon: 'smartphone',     label: 'Mobile No.' },
  { key: 'membership', icon: 'badge',           label: 'Member No.' },
  { key: 'card',       icon: 'credit_card',     label: 'Card No.' },
  { key: 'qr',         icon: 'qr_code_scanner', label: 'Scan QR' },
] as const;
type TabKey = typeof TABS[number]['key'];

const PLACEHOLDERS: Record<TabKey, string> = {
  mobile: 'e.g. +91 98765 43210',
  membership: 'e.g. SAL001',
  card: 'e.g. 4821 6739 0012 3847',
  qr: '',
};

// ─── MemberResultRow ──────────────────────────────────────────────────────────
function MemberResultRow({ member, onClick }: { member: Member; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '12px', background: T.white,
      border: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.white}
    >
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: T.orange, flexShrink: 0 }}>
        {member.name.charAt(0)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <p style={{ fontWeight: 700, fontSize: '13px', color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</p>
          {member.membership_type && <MembershipBadge name={member.membership_type.name} />}
        </div>
        <p style={{ fontSize: '12px', color: T.textMuted, margin: 0 }}>{member.phone} · #{member.member_code}</p>
      </div>
      <StatusBadge status={member.status} />
    </button>
  );
}

// ─── QR Scanner ──────────────────────────────────────────────────────────────
// KEY FIX: #mc-qr-scanner-region must ALWAYS exist in DOM before Html5Qrcode(id)
// is called. Conditionally rendering it breaks html5-qrcode. Use CSS only to hide.
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
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const state = scannerRef.current.getState?.();
      if (state === 2) await scannerRef.current.stop();
      scannerRef.current.clear?.();
    } catch { /* ignore */ }
    scannerRef.current = null;
  }, []);

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
    await scanner.start(constraint, { fps: 10, qrbox: { width: 200, height: 200 } }, onDecoded, () => {});
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    await stopScanner();
    scannedRef.current = false;
    setLastScanned(null);
    setStatus('requesting');
    if (typeof navigator === 'undefined' || !navigator?.mediaDevices?.getUserMedia) { setStatus('error'); return; }
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      let deviceList: { id: string; label: string }[] = [];
      try { deviceList = await Html5Qrcode.getCameras(); if (deviceList?.length > 0) setCameras(deviceList); } catch {}
      if (deviceList.length > 0) {
        try { await startWithConstraint(deviceList[deviceList.length - 1].id); setStatus('active'); return; }
        catch { await stopScanner(); }
      }
      try { await startWithConstraint({ facingMode: { ideal: 'environment' } }); setStatus('active'); return; }
      catch { await stopScanner(); }
      try { await startWithConstraint({ facingMode: 'user' }); setStatus('active'); return; }
      catch { await stopScanner(); }
      setStatus('error');
    } catch (err: any) {
      await stopScanner();
      const msg = (err?.message ?? '').toLowerCase();
      const name = err?.name ?? '';
      if (name === 'NotAllowedError' || msg.includes('denied') || msg.includes('permission')) {
        setStatus('denied');
      } else { setStatus('error'); }
    }
  }, [stopScanner, startWithConstraint]);

  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;
    const next = (activeCamIndex + 1) % cameras.length;
    setActiveCamIndex(next);
    setStatus('requesting');
    try { await startWithConstraint(cameras[next].id); setStatus('active'); }
    catch { setStatus('error'); }
  }, [cameras, activeCamIndex, startWithConstraint]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempEl = fileTempRef.current;
      if (!tempEl) { alert('Scanner not ready.'); return; }
      tempEl.innerHTML = '';
      const decoder = new Html5Qrcode(tempEl.id);
      const text = await decoder.scanFile(file, true);
      try { decoder.clear(); } catch {}
      setLastScanned(text);
      onScanRef.current(text);
    } catch { alert('No QR code detected. Please try a clearer photo.'); }
    finally { setFileScanning(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { startScanner(); }, 50);
    return () => { clearTimeout(t); stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHTTPS = typeof window !== 'undefined' && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  const showVideoPanel = status === 'active' || status === 'requesting';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0', width: '100%' }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} />
      <div id="mc-qr-temp-decoder" ref={fileTempRef} style={{ display: 'none' }} />

      {!isHTTPS && (
        <div style={{ width: '100%', padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', fontSize: '12px', color: '#92400E', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>warning</span>
          Camera scanning requires HTTPS. This page is on HTTP — live scanning may not work.
        </div>
      )}

      {/* Video panel — ALWAYS in DOM */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', visibility: showVideoPanel ? 'visible' : 'hidden', height: showVideoPanel ? 'auto' : 0, overflow: showVideoPanel ? 'visible' : 'hidden' }}>
        {status === 'requesting' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '28px', color: T.orange }}>camera_alt</span>
            </div>
            <p style={{ fontSize: '13px', color: T.textMuted, textAlign: 'center', margin: 0 }}>Starting camera… allow access when prompted.</p>
          </div>
        )}
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px', visibility: status === 'requesting' ? 'hidden' : 'visible', height: status === 'requesting' ? 0 : 'auto', overflow: 'hidden' }}>
          <div id="mc-qr-scanner-region" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#000', minHeight: '260px' }} />
          {status === 'active' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: '16px' }}>
              <div style={{ position: 'absolute', top: '12px', left: '12px', width: '28px', height: '28px', borderTop: `2px solid ${T.orange}`, borderLeft: `2px solid ${T.orange}`, borderRadius: '4px 0 0 0' }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', width: '28px', height: '28px', borderTop: `2px solid ${T.orange}`, borderRight: `2px solid ${T.orange}`, borderRadius: '0 4px 0 0' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '28px', height: '28px', borderBottom: `2px solid ${T.orange}`, borderLeft: `2px solid ${T.orange}`, borderRadius: '0 0 0 4px' }} />
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '28px', height: '28px', borderBottom: `2px solid ${T.orange}`, borderRight: `2px solid ${T.orange}`, borderRadius: '0 0 4px 0' }} />
              <div className="scanner-line" />
            </div>
          )}
        </div>
        {status === 'active' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {cameras.length > 1 && (
              <button onClick={switchCamera} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', background: T.white, fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: T.textMuted }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cameraswitch</span>
                Switch Camera
              </button>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={fileScanning} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', border: `1px solid ${T.border}`, borderRadius: '8px', background: T.white, fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: T.textMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>image</span>
              {fileScanning ? 'Reading…' : 'Upload QR Image'}
            </button>
          </div>
        )}
        {status === 'active' && (
          lastScanned ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#E0FFF6', color: '#006B55', padding: '8px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 700 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>qr_code</span>
              QR detected — looking up member…
            </div>
          ) : (
            <p style={{ fontSize: '13px', color: T.textMuted, textAlign: 'center', margin: 0 }}>Point camera at the QR code on the member's card.</p>
          )
        )}
      </div>

      {/* Permission denied */}
      {status === 'denied' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0', width: '100%' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#EF4444' }}>no_photography</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Camera Access Denied</p>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: 0, maxWidth: '280px' }}>Your browser blocked the camera. Upload a QR photo, or allow camera access.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button onClick={() => fileInputRef.current?.click()} disabled={fileScanning} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>upload_file</span>
              {fileScanning ? 'Reading…' : 'Upload QR Photo'}
            </button>
            <button onClick={startScanner} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', border: `1px solid ${T.border}`, background: T.white, borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: T.textMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Try Camera
            </button>
          </div>
          <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '12px 14px', fontSize: '12px', color: T.textMuted, maxWidth: '280px', width: '100%' }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: T.orange }}>help_outline</span>
              Allow camera in Chrome:
            </p>
            <p style={{ margin: '2px 0' }}>① Click the 🔒 in the address bar</p>
            <p style={{ margin: '2px 0' }}>② Site settings → Camera → Allow</p>
            <p style={{ margin: '2px 0' }}>③ Refresh and try again</p>
          </div>
        </div>
      )}

      {/* Camera error */}
      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '16px 0', width: '100%' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: T.textLight }}>videocam_off</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Live Camera Unavailable</p>
            <p style={{ fontSize: '13px', color: T.textMuted, margin: 0, maxWidth: '280px' }}>Take a photo of the QR code and upload it — it works the same way!</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '280px' }}>
            <button onClick={() => cameraInputRef.current?.click()} disabled={fileScanning} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
              {fileScanning ? 'Scanning…' : '📷 Take Photo of QR Code'}
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={fileScanning} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: `1px solid ${T.border}`, background: T.white, borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: T.textMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>image</span>
              Upload from Gallery
            </button>
            <button onClick={startScanner} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: `1px solid ${T.border}`, background: T.white, borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: T.textMuted }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Retry Live Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SearchMemberPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as TabKey | null;
  const [tab, setTab] = useState<TabKey>(urlTab && ['mobile', 'membership', 'qr', 'card'].includes(urlTab) ? urlTab : 'qr');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [recent, setRecent] = useState<Member[]>(getRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (urlTab && ['mobile', 'membership', 'qr', 'card'].includes(urlTab)) setTab(urlTab);
  }, [urlTab]);
  useEffect(() => { inputRef.current?.focus(); }, [tab]);

  const performSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setNotFound(false); setSearchError(false); setResults([]);
    try {
      let found: Member[];
      if (tab === 'card') {
        const m = await api.searchMemberByCard(user?.merchant_id || '', query);
        found = m ? [m] : [];
      } else {
        found = await api.searchMembers(user?.merchant_id || '', query);
      }
      if (found.length === 0) { setNotFound(true); }
      else if (found.length === 1) { addRecentSearch(found[0]); navigate(`/portal/members/${found[0].id}`); }
      else { setResults(found); }
    } catch { setSearchError(true); }
    finally { setSearching(false); }
  };

  const goToMember = (member: Member) => {
    addRecentSearch(member);
    navigate(`/portal/members/${member.id}`);
  };

  return (
    <div style={{ background: T.bg, minHeight: '100dvh', fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 20px 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: T.text, margin: '0 0 4px', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>Customer Lookup</h1>
          <p style={{ fontSize: '13px', color: T.textMuted, margin: 0 }}>Find a member to manage benefits or process a redemption.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }} className="search-grid">

          {/* Search Card */}
          <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
              {TABS.map(t => (
                <button key={t.key} onClick={() => { setTab(t.key); setQuery(''); setResults([]); setNotFound(false); }} style={{
                  flex: 1, padding: '14px 8px', fontSize: '12px', fontWeight: 700,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                  borderBottom: tab === t.key ? `2px solid ${T.orange}` : '2px solid transparent',
                  background: tab === t.key ? T.orangeLight : 'transparent',
                  color: tab === t.key ? T.orangeDark : T.textMuted,
                  marginBottom: '-1px',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', fontVariationSettings: tab === t.key ? "'FILL' 1" : "'FILL' 0" }}>{t.icon}</span>
                  <span className="tab-label">{t.label}</span>
                </button>
              ))}
            </div>

            <div style={{ padding: '20px' }}>
              {tab !== 'qr' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: T.text, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {tab === 'mobile' ? 'Mobile Number' : tab === 'card' ? '16-Digit Card Number' : 'Membership Number'}
                    </label>
                    {tab === 'card' && <p style={{ fontSize: '12px', color: T.textMuted, marginBottom: '8px', marginTop: 0 }}>Enter or scan the number printed on the physical membership card.</p>}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        ref={inputRef}
                        type={tab === 'mobile' ? 'tel' : 'text'}
                        value={query}
                        onChange={e => { setQuery(e.target.value); setNotFound(false); setResults([]); }}
                        onKeyDown={e => e.key === 'Enter' && performSearch()}
                        placeholder={PLACEHOLDERS[tab]}
                        autoFocus
                        style={{ flex: 1, height: '50px', padding: '0 14px', border: `1.5px solid ${T.border}`, borderRadius: '12px', fontSize: '15px', color: T.text, background: '#F8FAFC', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                        onFocus={e => (e.target as HTMLInputElement).style.borderColor = T.orange}
                        onBlur={e => (e.target as HTMLInputElement).style.borderColor = T.border}
                      />
                      <button onClick={performSearch} disabled={searching || !query.trim()} style={{
                        height: '50px', padding: '0 20px',
                        background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
                        color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px',
                        cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
                        opacity: searching || !query.trim() ? 0.6 : 1,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 3px 12px rgba(255,107,53,0.3)',
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px', animation: searching ? 'spin 1s linear infinite' : 'none' }}>{searching ? 'progress_activity' : 'search'}</span>
                        Search
                      </button>
                    </div>
                  </div>

                  {searchError && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#EF4444', display: 'block', marginBottom: '8px' }}>wifi_off</span>
                      <p style={{ fontWeight: 700, color: T.text, margin: '0 0 4px', fontSize: '14px' }}>Search Failed</p>
                      <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 12px' }}>Could not connect to server.</p>
                      <button onClick={performSearch} style={{ padding: '8px 16px', border: `1px solid ${T.border}`, borderRadius: '8px', background: T.white, fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: T.textMuted }}>Try Again</button>
                    </div>
                  )}

                  {notFound && (
                    <div style={{ background: T.orangeLight, border: `1px dashed ${T.orange}40`, borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '36px', color: T.textLight, display: 'block', marginBottom: '10px' }}>person_off</span>
                      <p style={{ fontWeight: 700, color: T.text, margin: '0 0 4px', fontSize: '14px' }}>Member Not Found</p>
                      <p style={{ fontSize: '12px', color: T.textMuted, margin: '0 0 14px' }}>No member found for "{query}"</p>
                      <button onClick={() => navigate('/portal/members/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                        Add as New Member
                      </button>
                    </div>
                  )}

                  {results.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: T.textMuted, margin: '0 0 4px' }}>{results.length} members found</p>
                      {results.map(m => <MemberResultRow key={m.id} member={m} onClick={() => goToMember(m)} />)}
                    </div>
                  )}
                </div>
              ) : (
                <QrScannerView onScan={async (scannedValue) => {
                  try {
                    const urlMatch = scannedValue.match(/\/m\/([^/?#]+)/);
                    const publicToken = urlMatch ? urlMatch[1] : null;
                    if (publicToken) {
                      const byToken = await api.getMemberByToken(publicToken);
                      if (byToken) { navigate(`/portal/members/${byToken.member_id}`); return; }
                      addToast('error', 'QR token not found — member may have been removed');
                      return;
                    }
                    const cardNumber = scannedValue.replace(/^METROCARDZ:/i, '').trim();
                    const byCard = await api.searchMemberByCard(user?.merchant_id || '', cardNumber);
                    if (byCard) { addRecentSearch(byCard); navigate(`/portal/members/${byCard.id}`); return; }
                    try {
                      const resolved = await api.resolveCardNumber(cardNumber);
                      if (!resolved) addToast('error', `Card ${cardNumber} is not registered in the system.`);
                      else if (!resolved.merchant_id) addToast('error', `Card ${cardNumber} exists but not allocated to any merchant.`);
                      else if (resolved.merchant_id !== user?.merchant_id) addToast('error', `Card ${cardNumber} belongs to a different merchant.`);
                      else if (!resolved.member_id) addToast('error', `Card ${cardNumber} is in your inventory but not yet assigned.`);
                      else addToast('error', 'No member found for this QR code');
                    } catch { addToast('error', `Card ${cardNumber} not found in system.`); }
                  } catch { addToast('error', 'QR scan failed — please try manual search'); }
                }} />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Recent Searches */}
            <div style={{ background: T.white, borderRadius: '16px', border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Recent Searches</p>
                {recent.length > 0 && <button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }} style={{ fontSize: '11px', color: T.orange, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>}
              </div>
              {recent.length === 0 ? (
                <p style={{ padding: '20px 16px', fontSize: '13px', color: T.textLight, textAlign: 'center', margin: 0 }}>No recent searches</p>
              ) : (
                recent.map((m, i) => (
                  <button key={m.id} onClick={() => goToMember(m)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', border: 'none', borderBottom: i < recent.length - 1 ? `1px solid ${T.border}` : 'none', background: 'none', cursor: 'pointer', transition: 'background 0.1s', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: T.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: T.orange, flexShrink: 0 }}>{m.name.charAt(0)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ fontSize: '11px', color: T.textLight, margin: 0 }}>{m.phone}</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: T.textLight }}>chevron_right</span>
                  </button>
                ))
              )}
            </div>

            {/* Quick Add */}
            <div style={{ background: T.text, borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '-8px', bottom: '-8px', fontSize: '80px', color: 'rgba(255,255,255,0.06)', fontVariationSettings: "'FILL' 1" }}>person_add</span>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', margin: '0 0 6px', position: 'relative', fontFamily: '"Plus Jakarta Sans", Inter, sans-serif' }}>New Member?</h4>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '0 0 14px', position: 'relative', lineHeight: 1.5 }}>Enroll a customer and generate their membership card instantly.</p>
              <button onClick={() => navigate('/portal/members/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: T.orange, color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', position: 'relative', boxShadow: '0 3px 12px rgba(255,107,53,0.4)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                Add Member
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/portal/members/new')} style={{
        position: 'fixed', right: '20px', bottom: '88px', width: '52px', height: '52px',
        background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`,
        color: '#fff', border: 'none', borderRadius: '14px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(255,107,53,0.4)', zIndex: 40,
      }} className="search-fab">
        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>person_add</span>
      </button>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .tab-label { display: none; }
        @media (min-width: 480px) { .tab-label { display: block; } }
        @media (max-width: 767px) {
          .search-grid { grid-template-columns: 1fr !important; }
          .search-fab { bottom: 80px !important; }
        }
      `}</style>
    </div>
  );
}