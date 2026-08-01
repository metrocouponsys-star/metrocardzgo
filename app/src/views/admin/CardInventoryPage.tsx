import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useToastStore } from '../../store/toastStore';
import { ConfirmModal } from '../../components/ui/Modal';
import type { CardInventoryItem, Merchant } from '../../types';
import * as api from '../../api';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'unassigned' | 'merchant_allocated' | 'member_linked' | 'deactivated';
type WizardStep = 1 | 2 | 3 | 4;

const STATUS_CONFIG: Record<string, { cls: string; label: string; icon: string }> = {
  unassigned:         { cls: 'bg-surface-container text-on-surface-variant',       label: 'Unassigned',  icon: 'inventory_2' },
  merchant_allocated: { cls: 'bg-primary-container/40 text-primary',               label: 'Allocated',   icon: 'store' },
  member_linked:      { cls: 'bg-secondary-container text-secondary',              label: 'Linked',      icon: 'person' },
  deactivated:        { cls: 'bg-error-container text-on-error-container',         label: 'Deactivated', icon: 'block' },
};

const PAGE_SIZE = 25;

/** Generate sequential 16-digit card numbers like "1234 5678 9012 0001" */
function generateCardNumbers(prefix: string, start: number, count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = (start + i).toString().padStart(4, '0');
    const raw = (prefix + n).replace(/\D/g, '').slice(0, 16).padEnd(16, '0');
    result.push(`${raw.slice(0,4)} ${raw.slice(4,8)} ${raw.slice(8,12)} ${raw.slice(12,16)}`);
  }
  return result;
}

/** Compress an image file to a data URL with max size ~100KB */
async function compressImage(file: File, maxWidth = 600, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Wizard Step Indicator ───────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: WizardStep; total: number }) {
  const steps = [
    { n: 1, label: 'Add Cards', icon: 'add_card' },
    { n: 2, label: 'Download QR', icon: 'qr_code_2' },
    { n: 3, label: 'Card Image', icon: 'image' },
    { n: 4, label: 'Allocate', icon: 'storefront' },
  ];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-label-md border-2 transition-all
              ${current === s.n ? 'bg-primary text-on-primary border-primary shadow-md scale-110' :
                current > s.n ? 'bg-secondary text-on-secondary border-secondary' :
                'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
              {current > s.n
                ? <span className="material-symbols-outlined text-[18px]">check</span>
                : <span className="material-symbols-outlined text-[18px]">{s.icon}</span>}
            </div>
            <span className={`text-[10px] font-semibold whitespace-nowrap ${current === s.n ? 'text-primary' : current > s.n ? 'text-secondary' : 'text-on-surface-variant'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${current > s.n + 1 || (current === s.n + 1) ? 'bg-secondary' : current > s.n ? 'bg-primary' : 'bg-outline-variant/40'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CardInventoryPage() {
  const { addToast } = useToastStore();

  const [cards, setCards] = useState<CardInventoryItem[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMerchant, setFilterMerchant] = useState('');
  const [page, setPage] = useState(1);

  // ─── Wizard State ──────────────────────────────────────────────────────────
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);

  // Step 1: Add cards
  const [addMode, setAddMode] = useState<'paste' | 'generate'>('generate');
  const [bulkInput, setBulkInput] = useState('');
  const [genPrefix, setGenPrefix] = useState('4821 6739 00');
  const [genStart, setGenStart] = useState(1);
  const [genCount, setGenCount] = useState(50);
  const [addLoading, setAddLoading] = useState(false);
  const [wizardCards, setWizardCards] = useState<string[]>([]); // card numbers from step 1

  // Step 3: Card image upload
  const [cardImageDataUrl, setCardImageDataUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4: Allocate
  const [allocateMerchant, setAllocateMerchant] = useState('');
  const [allocateQty, setAllocateQty] = useState(50);
  const [allocateLoading, setAllocateLoading] = useState(false);

  // ─── Legacy panel state (for non-wizard flows) ─────────────────────────────
  const [deactivateTarget, setDeactivateTarget] = useState<CardInventoryItem | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<CardInventoryItem | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allCards, allMerchants] = await Promise.all([
        api.getCardInventory(),
        api.getAllMerchants(),
      ]);
      setCards(allCards);
      setMerchants(allMerchants);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    total:       cards.length,
    unassigned:  cards.filter(c => c.status === 'unassigned').length,
    allocated:   cards.filter(c => c.status === 'merchant_allocated').length,
    linked:      cards.filter(c => c.status === 'member_linked').length,
    deactivated: cards.filter(c => c.status === 'deactivated').length,
  }), [cards]);

  const filtered = useMemo(() => cards.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterMerchant && c.allocated_merchant_id !== filterMerchant) return false;
    if (searchQuery) {
      const q = searchQuery.replace(/\s/g, '').toLowerCase();
      return (
        c.card_number.replace(/\s/g, '').includes(q) ||
        (c.linked_member_name || '').toLowerCase().includes(q) ||
        (c.linked_member_phone || '').replace(/\s/g, '').includes(q) ||
        (c.allocated_merchant_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  }), [cards, filterStatus, filterMerchant, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filterStatus, filterMerchant, searchQuery]);

  const generatedPreview = useMemo(
    () => generateCardNumbers(genPrefix.replace(/\s/g, ''), genStart, Math.min(genCount, 5)),
    [genPrefix, genStart, genCount]
  );

  // ─── Wizard Handlers ──────────────────────────────────────────────────────
  const openWizard = () => {
    setWizardStep(1);
    setWizardCards([]);
    setCardImageDataUrl(null);
    setAllocateMerchant('');
    setAllocateQty(50);
    setBulkInput('');
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
  };

  // Step 1 → 2: Add cards to inventory and advance
  const handleStep1Submit = async () => {
    let lines: string[];
    if (addMode === 'generate') {
      lines = generateCardNumbers(genPrefix.replace(/\s/g, ''), genStart, genCount);
    } else {
      if (!bulkInput.trim()) return;
      lines = bulkInput.split(/[\n,]+/).map(l => l.trim()).filter(Boolean);
    }
    if (lines.length === 0) return;
    setAddLoading(true);
    try {
      const result = await api.addCardsToInventory(lines);
      addToast('success', `✅ Added ${result.added} cards${result.skipped ? `, ${result.skipped} duplicates skipped` : ''}`);
      if (result.errors?.length > 0) addToast('error', `${result.errors.length} invalid entries skipped`);
      setWizardCards(lines.slice(0, result.added + (result.skipped || 0)));
      await fetchData();
      setWizardStep(2);
    } catch { addToast('error', 'Failed to add cards'); }
    finally { setAddLoading(false); }
  };

  // Step 2: Download QR Excel
  const handleDownloadQr = async () => {
    if (wizardCards.length === 0) return;
    try {
      await api.downloadCardsQrExcel(wizardCards);
      addToast('success', '📊 QR code list downloaded!');
    } catch { addToast('error', 'Download failed'); }
  };

  // Step 3: Card image upload with compression
  const handleCardImageUpload = useCallback(async (file: File) => {
    setUploadingImage(true);
    try {
      const dataUrl = await compressImage(file, 800, 0.8);
      setCardImageDataUrl(dataUrl);
      addToast('success', 'Card design image ready');
    } catch { addToast('error', 'Failed to process image'); }
    finally { setUploadingImage(false); }
  }, []);

  const handleCardImageFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCardImageUpload(file);
  };

  // Step 3 → 4: Save card design and advance
  const handleStep3Submit = async () => {
    // Card image is optional — skip if not set
    if (cardImageDataUrl && allocateMerchant) {
      try {
        await api.setMerchantCardDesign(allocateMerchant, cardImageDataUrl);
      } catch { /* non-fatal */ }
    }
    setWizardStep(4);
  };

  // Step 4: Allocate
  const handleAllocate = async () => {
    if (!allocateMerchant || allocateQty <= 0) return;
    setAllocateLoading(true);
    try {
      const unassigned = cards.filter(c => c.status === 'unassigned').slice(0, allocateQty);
      if (unassigned.length === 0) { addToast('error', 'No unassigned cards available'); setAllocateLoading(false); return; }

      // If card design was set in step 3, save it for this merchant
      if (cardImageDataUrl) {
        await api.setMerchantCardDesign(allocateMerchant, cardImageDataUrl).catch(() => {});
      }

      await api.allocateCardsToMerchant(allocateMerchant, unassigned.map(c => c.id));
      const merchantName = merchants.find(m => m.id === allocateMerchant)?.business_name;
      addToast('success', `🎉 ${unassigned.length} cards allocated to ${merchantName}!`);
      await fetchData();
      closeWizard();
    } catch (e: any) { addToast('error', e.message || 'Allocation failed'); }
    finally { setAllocateLoading(false); }
  };

  // Legacy handlers
  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await api.deactivateCard(deactivateTarget.id);
      addToast('success', `Card ${deactivateTarget.card_number} deactivated`);
      setDeactivateTarget(null);
      fetchData();
    } catch { addToast('error', 'Deactivation failed'); }
    finally { setDeactivating(false); }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.revokeCardsFromMerchant([revokeTarget.id]);
      addToast('success', 'Card returned to unassigned pool');
      setRevokeTarget(null);
      fetchData();
    } catch { addToast('error', 'Revoke failed'); }
    finally { setRevoking(false); }
  };

  const FILTER_LABELS: Record<FilterStatus, string> = {
    all: 'All', unassigned: 'Unassigned', merchant_allocated: 'Allocated',
    member_linked: 'Linked', deactivated: 'Deactivated',
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="px-container-margin-mobile md:px-container-margin-desktop py-6 max-w-7xl mx-auto space-y-xl animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="page-header mb-0">
          <h2 className="page-title flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
            Card Inventory
          </h2>
          <p className="page-subtitle">Manage pre-printed membership cards. Use the wizard to add, QR-export, set design, and allocate to merchants in one flow.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={async () => {
              try {
                await api.exportCardInventoryCsv(filterMerchant || undefined);
                addToast('success', 'Card inventory CSV download started!');
              } catch {
                addToast('error', 'Failed to export card inventory.');
              }
            }}
            className="btn-outline flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button onClick={openWizard} className="btn-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            New Card Batch Wizard
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-md">
        {[
          { label: 'Total Cards',  value: stats.total,       icon: 'credit_card',          cls: 'bg-primary-container/20 text-primary' },
          { label: 'Unassigned',   value: stats.unassigned,  icon: 'inventory_2',           cls: 'bg-surface-container text-on-surface-variant' },
          { label: 'Allocated',    value: stats.allocated,   icon: 'store',                 cls: 'bg-primary-fixed/20 text-primary' },
          { label: 'Linked',       value: stats.linked,      icon: 'person_check',          cls: 'bg-secondary-container text-secondary' },
          { label: 'Deactivated',  value: stats.deactivated, icon: 'block',                 cls: 'bg-error-container text-on-error-container' },
        ].map(s => (
          <div key={s.label} className="card p-md flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.cls}`}>
              <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
            </div>
            <div>
              <p className="text-headline-md font-bold">{loading ? '—' : s.value.toLocaleString()}</p>
              <p className="text-label-sm text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 4-Step Wizard ─────────────────────────────────────────────────────── */}
      {showWizard && (
        <div className="card p-lg space-y-lg animate-fade-in border-l-4 border-primary relative">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-headline-md font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                New Card Batch Wizard
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                Follow the 4 steps to add cards, export QR sheet, set card design, and allocate to merchant.
              </p>
            </div>
            <button onClick={closeWizard} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Step Indicator */}
          <StepIndicator current={wizardStep} total={4} />

          {/* ── Step 1: Add / Generate Cards ─────────────────────────────────── */}
          {wizardStep === 1 && (
            <div className="space-y-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">1</div>
                <h4 className="text-title-md font-bold">Add Card Numbers to Inventory</h4>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-surface-container rounded-xl p-1 gap-1 w-fit">
                {([['paste', 'Paste / Upload Numbers', 'content_paste'], ['generate', 'Auto Generate', 'auto_awesome']] as const).map(([mode, label, icon]) => (
                  <button
                    key={mode}
                    onClick={() => setAddMode(mode)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-label-md transition-all
                      ${addMode === mode ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {addMode === 'paste' ? (
                <>
                  <p className="text-body-md text-on-surface-variant">
                    Paste the 16-digit card numbers (one per line or comma-separated). Spaces within numbers are auto-handled.
                  </p>
                  <div className="bg-surface-container rounded-xl p-4 font-mono text-sm text-on-surface-variant leading-7">
                    <strong>Example:</strong><br />
                    4821 6739 0012 3841<br />
                    4821 6739 0012 3842<br />
                    4821673900123843
                  </div>
                  <textarea
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder="Paste card numbers here..."
                    rows={8}
                    className="input-field font-mono text-sm resize-none"
                  />
                  <p className="text-label-sm text-on-surface-variant">
                    {bulkInput.trim() ? `${bulkInput.split(/[\n,]+/).map(l => l.trim()).filter(Boolean).length} card(s) detected` : 'No cards entered'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-body-md text-on-surface-variant">
                    Auto-generate sequential 16-digit card numbers. Set a prefix (first 12 digits) — the last 4 fill incrementally.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <div>
                      <label className="form-label">Card Number Prefix (12 digits) *</label>
                      <input
                        className="input-field font-mono"
                        placeholder="e.g. 4821 6739 00"
                        value={genPrefix}
                        onChange={e => setGenPrefix(e.target.value)}
                        maxLength={14}
                      />
                      <p className="text-label-sm text-on-surface-variant mt-1">Last 4 digits auto-filled</p>
                    </div>
                    <div>
                      <label className="form-label">Starting Number *</label>
                      <input
                        type="number" min={1} max={9999}
                        className="input-field"
                        value={genStart}
                        onChange={e => setGenStart(Math.max(1, Number(e.target.value)))}
                      />
                    </div>
                    <div>
                      <label className="form-label">Quantity to Generate *</label>
                      <input
                        type="number" min={1} max={5000}
                        className="input-field"
                        value={genCount}
                        onChange={e => setGenCount(Math.max(1, Number(e.target.value)))}
                      />
                      <p className="text-label-sm text-on-surface-variant mt-1">e.g. 50 or 100</p>
                    </div>
                  </div>
                  {/* Preview */}
                  <div className="bg-surface-container rounded-xl p-4">
                    <p className="text-label-md font-bold text-on-surface-variant mb-2">Preview (first 5 of {genCount}):</p>
                    <div className="space-y-1">
                      {generatedPreview.map((n, i) => (
                        <p key={i} className="font-mono text-sm text-on-surface tracking-widest">{n}</p>
                      ))}
                      {genCount > 5 && <p className="text-label-sm text-on-surface-variant">… and {genCount - 5} more</p>}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button onClick={closeWizard} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleStep1Submit}
                  disabled={addLoading || (addMode === 'paste' && !bulkInput.trim())}
                  className="btn-primary flex items-center gap-2"
                >
                  {addLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                  {addLoading ? 'Adding...' : `Add ${addMode === 'generate' ? genCount : ''} Cards & Continue →`}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Download QR Excel ─────────────────────────────────────── */}
          {wizardStep === 2 && (
            <div className="space-y-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">2</div>
                <h4 className="text-title-md font-bold">Download QR Code List</h4>
              </div>

              <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-5 flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
                </div>
                <div>
                  <h5 className="font-bold text-on-surface mb-1">{wizardCards.length} Cards Ready</h5>
                  <p className="text-body-md text-on-surface-variant mb-3">
                    Download the QR code list for this batch. Each row contains the card number and the encoded QR value 
                    that gets printed on the physical card. Send this to your card printer.
                  </p>
                  <button onClick={handleDownloadQr} className="btn-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    Download QR Code List (CSV)
                  </button>
                </div>
              </div>

              <div className="bg-surface-container rounded-xl p-4 space-y-2">
                <p className="text-label-md font-bold text-on-surface-variant">Batch Preview (first 5):</p>
                {wizardCards.slice(0, 5).map((num, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-label-xs text-on-surface-variant font-bold">{i+1}</span>
                    <span className="font-mono text-sm text-on-surface tracking-widest">{num}</span>
                    <span className="text-label-xs text-on-surface-variant">→ QR: METROCARDZ:{num.replace(/\s/g, '')}</span>
                  </div>
                ))}
                {wizardCards.length > 5 && <p className="text-label-sm text-on-surface-variant">… and {wizardCards.length - 5} more</p>}
              </div>

              <div className="flex justify-between gap-2 pt-2 border-t border-outline-variant/20">
                <button onClick={() => setWizardStep(1)} className="btn-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setWizardStep(3)} className="btn-outline">
                    Skip Download →
                  </button>
                  <button onClick={() => { handleDownloadQr(); setWizardStep(3); }} className="btn-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">file_download</span>
                    Download & Continue →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Upload Card Image ────────────────────────────────────── */}
          {wizardStep === 3 && (
            <div className="space-y-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">3</div>
                <h4 className="text-title-md font-bold">Upload Card Design Image <span className="text-on-surface-variant font-normal text-label-sm">(Optional)</span></h4>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Upload the physical card design artwork. This image will be shown on the member's profile card. 
                Image is automatically compressed.
              </p>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) handleCardImageUpload(file);
                }}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
                  ${cardImageDataUrl ? 'border-secondary/40 bg-secondary-container/10' : 'border-outline-variant hover:border-primary hover:bg-primary-container/5'}`}
              >
                {uploadingImage ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-primary text-[40px]">progress_activity</span>
                    <p className="text-body-md text-on-surface-variant">Compressing image…</p>
                  </>
                ) : cardImageDataUrl ? (
                  <>
                    <img src={cardImageDataUrl} alt="Card design preview" className="max-h-48 rounded-xl shadow-elevated object-contain" />
                    <p className="text-label-sm text-secondary font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Card design uploaded — click to change
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-primary-container/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[32px]">add_photo_alternate</span>
                    </div>
                    <div className="text-center">
                      <p className="text-body-md font-bold text-on-surface">Click to upload or drag & drop</p>
                      <p className="text-label-sm text-on-surface-variant">PNG, JPG, WEBP — auto-compressed to ~100KB</p>
                    </div>
                    <button
                      type="button"
                      className="btn-outline flex items-center gap-2 mt-1"
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    >
                      <span className="material-symbols-outlined text-[16px]">upload</span>
                      Upload Image
                    </button>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCardImageFilePick}
              />

              {cardImageDataUrl && (
                <button
                  onClick={() => { setCardImageDataUrl(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-error text-label-sm flex items-center gap-1 hover:underline"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  Remove image
                </button>
              )}

              <div className="flex justify-between gap-2 pt-2 border-t border-outline-variant/20">
                <button onClick={() => setWizardStep(2)} className="btn-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                <button onClick={handleStep3Submit} className="btn-primary flex items-center gap-2">
                  {cardImageDataUrl ? 'Save Design & Continue →' : 'Skip & Continue →'}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Allocate to Merchant ─────────────────────────────────── */}
          {wizardStep === 4 && (
            <div className="space-y-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-label-md">4</div>
                <h4 className="text-title-md font-bold">Allocate Cards to Merchant</h4>
              </div>
              <p className="text-body-md text-on-surface-variant">
                Select a merchant and how many unassigned cards to give them. Cards are pulled from the global pool in order.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="form-label">Merchant *</label>
                  <select className="input-field" value={allocateMerchant} onChange={e => setAllocateMerchant(e.target.value)}>
                    <option value="">Select merchant...</option>
                    {merchants.filter(m => m.status === 'active').map(m => (
                      <option key={m.id} value={m.id}>{m.business_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Number of Cards *</label>
                  <input
                    type="number" min={1} max={stats.unassigned}
                    value={allocateQty}
                    onChange={e => setAllocateQty(Number(e.target.value))}
                    className="input-field"
                  />
                  <p className="text-label-sm text-on-surface-variant mt-1">{stats.unassigned} unassigned cards available in pool</p>
                </div>
              </div>

              {allocateMerchant && allocateQty > 0 && (
                <div className="rounded-xl p-5 space-y-3 bg-primary-container/10 border border-primary/20">
                  <h5 className="font-bold text-on-surface text-label-md">Allocation Summary</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface rounded-lg p-3 text-center">
                      <p className="text-headline-md font-bold text-primary">{Math.min(allocateQty, stats.unassigned)}</p>
                      <p className="text-label-sm text-on-surface-variant">Cards to allocate</p>
                    </div>
                    <div className="bg-surface rounded-lg p-3 text-center">
                      <p className="text-headline-md font-bold text-secondary">{merchants.find(m => m.id === allocateMerchant)?.business_name}</p>
                      <p className="text-label-sm text-on-surface-variant">Merchant</p>
                    </div>
                  </div>
                  {cardImageDataUrl && (
                    <div className="flex items-center gap-3 bg-surface rounded-lg p-3">
                      <img src={cardImageDataUrl} alt="Card design" className="w-16 h-10 object-cover rounded-lg border border-outline-variant" />
                      <div>
                        <p className="text-label-md font-bold text-on-surface">Card design included</p>
                        <p className="text-label-xs text-on-surface-variant">Will be shown on member profiles for this merchant</p>
                      </div>
                      <span className="material-symbols-outlined text-secondary ml-auto">check_circle</span>
                    </div>
                  )}
                  <p className="text-body-sm text-on-surface-variant">
                    The merchant's staff can then link each card to a member when they visit.
                  </p>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2 border-t border-outline-variant/20">
                <button onClick={() => setWizardStep(3)} className="btn-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back
                </button>
                <button
                  onClick={handleAllocate}
                  disabled={allocateLoading || !allocateMerchant || allocateQty <= 0 || stats.unassigned === 0}
                  className="btn-primary flex items-center gap-2"
                >
                  {allocateLoading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                  {allocateLoading ? 'Allocating...' : '🎉 Allocate Cards & Finish'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-surface-container rounded-xl p-1 gap-1 flex-wrap">
          {(['all', 'unassigned', 'merchant_allocated', 'member_linked', 'deactivated'] as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-label-md transition-all whitespace-nowrap
                ${filterStatus === s ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              {FILTER_LABELS[s]}
              {s !== 'all' && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold
                  ${filterStatus === s ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {s === 'unassigned' ? stats.unassigned : s === 'merchant_allocated' ? stats.allocated : s === 'member_linked' ? stats.linked : stats.deactivated}
                </span>
              )}
            </button>
          ))}
        </div>
        <select className="input-field w-auto min-w-[160px]" value={filterMerchant} onChange={e => setFilterMerchant(e.target.value)}>
          <option value="">All Merchants</option>
          {merchants.map(m => <option key={m.id} value={m.id}>{m.business_name}</option>)}
        </select>
        <div className="flex-1 relative min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            className="input-field pl-10 w-full"
            placeholder="Search card number, member, merchant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {['Card Number', 'Status', 'Merchant', 'Linked Member', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-label-md font-label-md text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-surface-container rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-2 opacity-40">credit_card_off</span>
                  <p className="text-body-md">No cards match your filters</p>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="mt-2 text-primary text-label-md hover:underline">Clear search</button>
                  )}
                </td></tr>
              ) : paginated.map(card => {
                const cfg = STATUS_CONFIG[card.status];
                // Get merchant card design for allocated merchant
                const cardMerchant = merchants.find(m => m.id === card.allocated_merchant_id);
                return (
                  <tr key={card.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {cardMerchant?.card_design_url ? (
                          <img src={cardMerchant.card_design_url} alt="Card" className="w-10 h-7 rounded object-cover border border-outline-variant flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                          </div>
                        )}
                        <span className="font-mono font-bold text-body-md tracking-widest">{card.card_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-label-sm px-2.5 py-1 rounded-full font-medium ${cfg.cls}`}>
                        <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">
                      {card.allocated_merchant_name || <span className="italic text-outline">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {card.linked_member_name ? (
                        <div>
                          <p className="text-body-md font-bold">{card.linked_member_name}</p>
                          <p className="text-label-sm text-on-surface-variant">{card.linked_member_phone}</p>
                        </div>
                      ) : <span className="italic text-outline text-body-md">—</span>}
                    </td>
                    <td className="px-4 py-3 text-label-sm text-on-surface-variant whitespace-nowrap">
                      {card.linked_at
                        ? <>Linked<br />{format(new Date(card.linked_at), 'dd MMM yy')}</>
                        : card.allocated_at
                        ? <>Allocated<br />{format(new Date(card.allocated_at), 'dd MMM yy')}</>
                        : format(new Date(card.created_at), 'dd MMM yy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {card.status === 'merchant_allocated' && (
                          <button
                            onClick={() => setRevokeTarget(card)}
                            className="text-label-sm text-primary hover:bg-primary-container/20 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Revoke
                          </button>
                        )}
                        {card.status !== 'deactivated' && (
                          <button
                            onClick={() => setDeactivateTarget(card)}
                            className="text-error hover:bg-error-container p-1.5 rounded-lg transition-colors"
                            title="Deactivate card"
                          >
                            <span className="material-symbols-outlined text-[16px]">block</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
          <p className="text-label-sm text-on-surface-variant">
            Showing <strong>{filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length.toLocaleString()}</strong> cards
            {filterStatus !== 'all' || filterMerchant || searchQuery ? ` (filtered from ${cards.length.toLocaleString()} total)` : ''}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={safePage === 1}
                onClick={() => setPage(1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <span className="material-symbols-outlined text-[18px]">first_page</span>
              </button>
              <button
                disabled={safePage === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-8 text-center text-on-surface-variant text-label-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-label-md transition-colors
                      ${safePage === p ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    {p}
                  </button>
                ))}
              <button
                disabled={safePage === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <button
                disabled={safePage === totalPages}
                onClick={() => setPage(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <span className="material-symbols-outlined text-[18px]">last_page</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirm: Deactivate */}
      <ConfirmModal
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title="Deactivate Card"
        danger
        isLoading={deactivating}
        confirmLabel="Deactivate"
        description={
          <div className="space-y-3">
            <div className="bg-surface-container rounded-xl p-4 font-mono text-body-md tracking-widest font-bold text-center">{deactivateTarget?.card_number}</div>
            <p className="text-body-md text-on-surface-variant">This card will be permanently deactivated. The member's mobile number will still work for redemption.</p>
          </div>
        }
      />

      {/* Confirm: Revoke */}
      <ConfirmModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke Card Allocation"
        danger={false}
        isLoading={revoking}
        confirmLabel="Revoke Allocation"
        description={`Return card "${revokeTarget?.card_number}" from "${revokeTarget?.allocated_merchant_name}" back to the unassigned pool. Only possible if the card is not yet linked to any member.`}
      />
    </div>
  );
}
