import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useToastStore } from '../../store/toastStore';
import * as api from '../../api';
import { InteractiveFlipCard } from '../../components/cards/InteractiveFlipCard';
import type {
  CardDesignConfig,
  CardScope,
  CardThemeId,
  CardFinish,
  ChipStyle,
  FoilBorder,
  GradientDirection,
  TierBadgeStyle,
  PresetIconId,
} from '../../types/cardDesign';
import {
  THEME_PRESETS,
  DEFAULT_STORE_CARD_DESIGN,
  DEFAULT_GO_CARD_DESIGN,
  loadSavedCardDesign,
  persistCardDesignLocally,
} from '../../types/cardDesign';

export default function CardDesignerStudio() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const merchantId = user?.merchant_id || 'mer-001';

  // Active Scope: Store Loyalty Card vs Metro Cardz GO Pass ("in both")
  const [activeScope, setActiveScope] = useState<CardScope>('store_loyalty');

  // Active Control Panel Tab
  const [activeTab, setActiveTab] = useState<'theme' | 'brand' | 'hardware' | 'back' | 'print'>('theme');

  // Card Design State
  const [design, setDesign] = useState<CardDesignConfig>(DEFAULT_STORE_CARD_DESIGN);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showPrintGuides, setShowPrintGuides] = useState(false);
  const [sampleMemberName, setSampleMemberName] = useState('RAHUL SHARMA');
  const [saving, setSaving] = useState(false);

  // Load saved design whenever scope or merchant changes
  useEffect(() => {
    const loaded = loadSavedCardDesign(merchantId, activeScope);
    // If merchant has a business name and brandName is default, prefill with merchant's real business name
    if (user?.merchant_name && loaded.brandName === DEFAULT_STORE_CARD_DESIGN.brandName && activeScope === 'store_loyalty') {
      loaded.brandName = user.merchant_name.toUpperCase();
    }
    setDesign(loaded);
    setIsFlipped(false);
  }, [merchantId, activeScope, user?.merchant_name]);

  // Update specific fields in design
  const updateDesign = (patch: Partial<CardDesignConfig>) => {
    setDesign((prev) => ({ ...prev, ...patch }));
  };

  // Apply a theme preset
  const handleApplyPreset = (themeId: CardThemeId) => {
    const preset = THEME_PRESETS.find((p) => p.id === themeId);
    if (!preset) return;
    updateDesign({
      themeId,
      ...preset.config,
    });
    addToast('success', `Applied preset: ${preset.name}`);
  };

  // Handle Logo Upload (converts image to base64 Data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('error', 'Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateDesign({
        logoType: 'custom_image',
        customLogoUrl: dataUrl,
      });
      addToast('success', 'Custom logo uploaded successfully');
    };
    reader.readAsDataURL(file);
  };

  // Save Card Design
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // 1. Save locally in localStorage for instant reactive pass updates
      persistCardDesignLocally(merchantId, design);

      // 2. Persist to API / merchant profile if available
      try {
        const serialized = JSON.stringify(design);
        await api.setMerchantCardDesign(merchantId, serialized);
      } catch (err) {
        console.warn('API save bypassed or offline, design preserved locally in browser', err);
      }

      addToast('success', `Card design for ${activeScope === 'store_loyalty' ? 'Store Membership' : 'Metro Cardz GO'} saved successfully!`);
    } catch {
      addToast('error', 'Failed to save card design');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleReset = () => {
    const fallback = activeScope === 'go_pass' ? DEFAULT_GO_CARD_DESIGN : DEFAULT_STORE_CARD_DESIGN;
    setDesign({
      ...fallback,
      brandName: user?.merchant_name ? user.merchant_name.toUpperCase() : fallback.brandName,
    });
    addToast('info', 'Reset to recommended defaults');
  };

  // Export / Print Spec Sheet
  const handlePrintSpecSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ── Header & Scope Switcher ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-[26px]">palette</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Card Design Studio</h1>
            <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
              Self-Serve Module
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Customize luxury physical and digital membership cards for your store and cross-brand GO network.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset Defaults
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">{saving ? 'hourglass_top' : 'save'}</span>
            {saving ? 'Saving...' : 'Save Card Design'}
          </button>
        </div>
      </div>

      {/* ── Dual Scope Switcher ("in both") ─────────────────────────────── */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-2 max-w-md">
        <button
          onClick={() => setActiveScope('store_loyalty')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeScope === 'store_loyalty'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-amber-600">storefront</span>
          Store Loyalty Pass
        </button>

        <button
          onClick={() => setActiveScope('go_pass')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeScope === 'go_pass'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] text-orange-600">local_fire_department</span>
          Metro Cardz GO Pass
        </button>
      </div>

      {/* ── Main Studio Grid (Canvas Left, Controls Right) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: 3D Interactive Canvas & Inspection ─────────────────── */}
        <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col items-center justify-between min-h-[520px] relative overflow-hidden">
          {/* Subtle background glow */}
          <div
            className="absolute -top-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: design.accentColor }}
          />

          {/* Canvas Top Bar */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 z-10 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-300">
                {activeScope === 'store_loyalty' ? 'In-Store Membership Pass' : 'Metro Cardz GO Co-Branded Pass'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPrintGuides(!showPrintGuides)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  showPrintGuides
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                }`}
              >
                {showPrintGuides ? '✓ CR80 Specs On' : 'Guides'}
              </button>
            </div>
          </div>

          {/* Center: Universal 3D Interactive Card Preview */}
          <div className="w-full py-4 z-10 flex flex-col items-center justify-center">
            <InteractiveFlipCard
              design={design}
              memberName={sampleMemberName}
              cardNumber="•••• •••• •••• 8842"
              validThru={design.defaultExpiryValue}
              tier={design.tierLabel}
              points={1450}
              isFlipped={isFlipped}
              onFlip={setIsFlipped}
              interactive={true}
              showPrintGuides={showPrintGuides}
              size="responsive"
            />

            {/* Click to Flip Controls */}
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => setIsFlipped(false)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  !isFlipped
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Front Face
              </button>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 transition-all"
                title="Toggle 3D Flip"
              >
                <span className="material-symbols-outlined text-[18px]">sync</span>
              </button>

              <button
                onClick={() => setIsFlipped(true)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isFlipped
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Back Face
              </button>
            </div>
          </div>

          {/* Canvas Bottom Specs & Sample Name Toggle */}
          <div className="w-full pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 z-10 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Preview Name:</span>
              <input
                type="text"
                value={sampleMemberName}
                onChange={(e) => setSampleMemberName(e.target.value.toUpperCase())}
                className="bg-white/10 border border-white/15 rounded-lg px-2 py-0.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400 w-32"
                placeholder="MEMBER NAME"
              />
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span>Theme: <strong className="text-white">{design.themeId}</strong></span>
              <span>Finish: <strong className="text-white">{design.finish}</strong></span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Control Panels & Customizer ────────────────────────── */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-100 pb-3 gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'theme', label: 'Theme & Finish', icon: 'palette' },
              { id: 'brand', label: 'Brand & Logo', icon: 'branding_watermark' },
              { id: 'hardware', label: 'Chip & NFC', icon: 'memory' },
              { id: 'back', label: 'Back & Terms', icon: 'notes' },
              { id: 'print', label: 'Print Spec', icon: 'print' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════ PANEL 1: THEME & FINISH ════ */}
          {activeTab === 'theme' && (
            <div className="space-y-6 animate-fade-in">
              {/* Presets Gallery */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  Luxury Theme Presets (One-Click)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {THEME_PRESETS.map((p) => {
                    const isSelected = design.themeId === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleApplyPreset(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400/30'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {/* Mini Color Swatch Bar */}
                        <div
                          className="h-2 rounded-full mb-2 w-full"
                          style={{
                            background: `linear-gradient(90deg, ${p.config.primaryColor} 0%, ${p.config.secondaryColor} 50%, ${p.config.accentColor} 100%)`,
                          }}
                        />
                        <div className="text-xs font-bold text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{p.category}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Color Overrides */}
              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-3">
                  Palette & Gradient Overrides
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.primaryColor}
                        onChange={(e) => updateDesign({ primaryColor: e.target.value, themeId: 'custom' })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-700">{design.primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.secondaryColor}
                        onChange={(e) => updateDesign({ secondaryColor: e.target.value, themeId: 'custom' })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-700">{design.secondaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Accent / Foil</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.accentColor}
                        onChange={(e) => updateDesign({ accentColor: e.target.value, themeId: 'custom' })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-700">{design.accentColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={design.textColor}
                        onChange={(e) => updateDesign({ textColor: e.target.value, themeId: 'custom' })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                      />
                      <span className="text-xs font-mono text-slate-700">{design.textColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gradient Direction */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  Gradient Direction
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'linear-diagonal', label: 'Diagonal 135°' },
                    { id: 'linear-horizontal', label: 'Horizontal 90°' },
                    { id: 'radial', label: 'Radial Center' },
                    { id: 'mesh', label: 'Mesh Matrix' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => updateDesign({ gradientDirection: g.id as GradientDirection })}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        design.gradientDirection === g.id
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-black'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Surface Finish Texture */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  Surface Texture / Finish
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'brushed_metal', label: 'Brushed Metal', desc: 'Anodized aluminum lines' },
                    { id: 'carbon_weave', label: 'Carbon Weave', desc: 'Tactical mesh fiber' },
                    { id: 'matte_leather', label: 'Matte Leather', desc: 'Soft grain stipple' },
                    { id: 'gloss_luxe', label: 'High Gloss', desc: 'Mirror finish reflection' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateDesign({ finish: f.id as CardFinish })}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        design.finish === f.id
                          ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{f.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Foil Border Accent */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  Foil Edge Accent
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'gold', label: '24K Gold' },
                    { id: 'rose_gold', label: 'Rose Gold' },
                    { id: 'platinum', label: 'Platinum' },
                    { id: 'neon', label: 'Neon Aura' },
                    { id: 'none', label: 'Clean / None' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => updateDesign({ foilBorder: b.id as FoilBorder })}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                        design.foilBorder === b.id
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-black'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ PANEL 2: BRAND & LOGO ════ */}
          {activeTab === 'brand' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                  Brand Business Name
                </label>
                <input
                  type="text"
                  value={design.brandName}
                  onChange={(e) => updateDesign({ brandName: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 uppercase"
                  placeholder="e.g. GLAMOUR SALON & SPA"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                  Brand Subtitle / Tagline
                </label>
                <input
                  type="text"
                  value={design.subtitle}
                  onChange={(e) => updateDesign({ subtitle: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:border-amber-500 uppercase"
                  placeholder="e.g. EXCLUSIVE PRESTIGE MEMBER"
                />
              </div>

              {/* Logo Selection Mode */}
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  Store Logo
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => updateDesign({ logoType: 'preset_icon' })}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      design.logoType === 'preset_icon'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Boutique Crests
                  </button>
                  <button
                    onClick={() => updateDesign({ logoType: 'custom_image' })}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      design.logoType === 'custom_image'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Upload Custom Logo
                  </button>
                </div>

                {design.logoType === 'preset_icon' ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'crown', label: 'Crown' },
                      { id: 'diamond', label: 'Diamond' },
                      { id: 'star', label: 'Star' },
                      { id: 'scissors', label: 'Salon' },
                      { id: 'cutlery', label: 'Dining' },
                      { id: 'shield', label: 'Shield' },
                      { id: 'flame', label: 'Flame' },
                      { id: 'monogram', label: 'Classic' },
                    ].map((icon) => (
                      <button
                        key={icon.id}
                        onClick={() => updateDesign({ presetIcon: icon.id as PresetIconId })}
                        className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center gap-1 ${
                          design.presetIcon === icon.id
                            ? 'bg-amber-50 border-amber-500 text-amber-900 font-black'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold">{icon.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-2 bg-slate-50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">PNG or SVG with transparent background recommended</p>
                    {design.customLogoUrl && (
                      <div className="mt-2 flex items-center justify-center gap-2">
                        <img src={design.customLogoUrl} alt="Preview" className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-white" />
                        <span className="text-xs text-emerald-600 font-bold">Logo loaded</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tier Badge Controls */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                    Tier Badge Title
                  </label>
                  <input
                    type="text"
                    value={design.tierLabel}
                    onChange={(e) => updateDesign({ tierLabel: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 uppercase"
                    placeholder="e.g. VIP GOLD, PRIME, FOUNDER"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                    Tier Badge Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'auric_pill', label: 'Auric Metallic' },
                      { id: 'glass_frosted', label: 'Frosted Glass' },
                      { id: 'minimal_border', label: 'Minimalist' },
                      { id: 'solid_accent', label: 'Solid Accent' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => updateDesign({ tierBadgeStyle: s.id as TierBadgeStyle })}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                          design.tierBadgeStyle === s.id
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-black'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ PANEL 3: HARDWARE & CHIP ════ */}
          {activeTab === 'hardware' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  EMV Smart Chip Simulation
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'gold_emv', label: '24K Gold EMV Microchip', desc: 'Standard luxury credit chip' },
                    { id: 'silver_emv', label: 'Platinum/Silver Chip', desc: 'Sleek silver contact geometry' },
                    { id: 'minimal_wire', label: 'Minimalist Circuit', desc: 'Modern subtle trace' },
                    { id: 'none', label: 'No Chip (Pure Clean)', desc: 'Clean front without chip' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateDesign({ chipStyle: c.id as ChipStyle })}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        design.chipStyle === c.id
                          ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-400'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{c.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{c.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-2">
                  Contactless & Holographic Indicators
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Contactless NFC Waves Icon</div>
                      <div className="text-[11px] text-slate-400">Shows NFC contactless wave indicator on front</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={design.showNfcIcon}
                      onChange={(e) => updateDesign({ showNfcIcon: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Show Cardholder Name on Front</div>
                      <div className="text-[11px] text-slate-400">Renders member name on card bottom left</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={design.showCardholderName}
                      onChange={(e) => updateDesign({ showCardholderName: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <div>
                      <div className="text-xs font-bold text-slate-900">Show Expiry Date on Front</div>
                      <div className="text-[11px] text-slate-400">Renders "VALID THRU" date label on bottom right</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={design.showExpiry}
                      onChange={(e) => updateDesign({ showExpiry: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ════ PANEL 4: BACK & TERMS ════ */}
          {activeTab === 'back' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider block mb-1">
                  Terms & Conditions (Card Back)
                </label>
                <textarea
                  rows={3}
                  value={design.termsText}
                  onChange={(e) => updateDesign({ termsText: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  placeholder="Enter terms and conditions..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Support Helpline Phone</label>
                  <input
                    type="text"
                    value={design.helplinePhone}
                    onChange={(e) => updateDesign({ helplinePhone: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp Support</label>
                  <input
                    type="text"
                    value={design.helplineWhatsapp}
                    onChange={(e) => updateDesign({ helplineWhatsapp: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Toggles for back layout */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">Magnetic Stripe at Top</span>
                  <input
                    type="checkbox"
                    checked={design.magneticStripe}
                    onChange={(e) => updateDesign({ magneticStripe: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">Authorized Signature Panel</span>
                  <input
                    type="checkbox"
                    checked={design.signatureStrip}
                    onChange={(e) => updateDesign({ signatureStrip: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">Barcode & QR Code on Back</span>
                  <input
                    type="checkbox"
                    checked={design.showBarcode && design.showQrCode}
                    onChange={(e) => updateDesign({ showBarcode: e.target.checked, showQrCode: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">"Powered by Metro Cardz Network" Co-Branding</span>
                  <input
                    type="checkbox"
                    checked={design.coBrandingBadge}
                    onChange={(e) => updateDesign({ coBrandingBadge: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ════ PANEL 5: PRINT & MANUFACTURING SPECS ════ */}
          {activeTab === 'print' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="font-black flex items-center gap-1.5 text-amber-950">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Commercial PVC / Metal Card Manufacturing Standard
                </div>
                <p>
                  These dimensions follow the ISO/IEC 7810 ID-1 standard (CR80) required by PVC and metallic card manufacturers globally.
                </p>
              </div>

              {/* Technical Specifications Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-600">Standard Card Size</td>
                      <td className="p-2.5 font-mono text-slate-900 font-bold">85.60 mm × 53.98 mm (CR80)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600">Corner Radius</td>
                      <td className="p-2.5 font-mono text-slate-900">3.18 mm (1/8 inch)</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-600">Safety Bleed Margin</td>
                      <td className="p-2.5 font-mono text-slate-900">3.00 mm per edge (91.6 mm × 60.0 mm total)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600">Resolution Standard</td>
                      <td className="p-2.5 font-mono text-slate-900">300 DPI (1012 px × 638 px)</td>
                    </tr>
                    <tr className="bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-600">Card Material Types</td>
                      <td className="p-2.5 text-slate-900">0.76mm PVC Plastic, Brushed Brass, Matte Steel</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-600">Color Profile</td>
                      <td className="p-2.5 text-slate-900 font-mono">
                        Primary: {design.primaryColor} | Accent: {design.accentColor}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-2">
                <button
                  onClick={handlePrintSpecSheet}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-300 flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  Print / Save Production Specification Sheet (PDF)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
