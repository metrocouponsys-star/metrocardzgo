'use client';

import React, { useState } from 'react';
import type { CardDesignConfig, PresetIconId } from '../../types/cardDesign';
import { DEFAULT_STORE_CARD_DESIGN } from '../../types/cardDesign';

export interface InteractiveFlipCardProps {
  design?: CardDesignConfig;
  memberName?: string;
  cardNumber?: string;
  validThru?: string;
  tier?: string;
  points?: number;
  qrValue?: string;
  isFlipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  showPrintGuides?: boolean;
  className?: string;
}

// ── Preset Boutique Icon Renderer ─────────────────────────────────────────────
function renderPresetIcon(iconId?: PresetIconId, accentColor: string = '#D4AF37') {
  switch (iconId) {
    case 'diamond':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l4 6-10 12L2 9z" />
          <path d="M10 3v6l-4 6" />
          <path d="M14 3v6l4 6" />
          <path d="M2 9h20" />
        </svg>
      );
    case 'star':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill={accentColor} stroke={accentColor} strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'scissors':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case 'cutlery':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2v20M14 2v6a3 3 0 0 0 6 0V2M2 2v8a3 3 0 0 0 3 3h1v9M6 2v10" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v8" stroke={accentColor} strokeWidth="2" />
        </svg>
      );
    case 'flame':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.5-3.5-2.5-4.5-1 1-2.5 2.87-2.5 4.5z" fill={accentColor} />
          <path d="M12 2c5 5 7 9 7 13a7 7 0 1 1-14 0c0-4 3-8 7-13z" />
        </svg>
      );
    case 'crown':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" fill={accentColor} fillOpacity="0.25" />
          <circle cx="2" cy="4" r="1.5" fill={accentColor} />
          <circle cx="12" cy="4" r="1.5" fill={accentColor} />
          <circle cx="22" cy="4" r="1.5" fill={accentColor} />
        </svg>
      );
  }
}

// ── Realistic EMV Smart Chip Geometry ─────────────────────────────────────────
function renderSmartChip(chipStyle: CardDesignConfig['chipStyle'], accentColor: string) {
  if (chipStyle === 'none') return null;

  const isGold = chipStyle === 'gold_emv';
  const isSilver = chipStyle === 'silver_emv';

  const baseGradient = isGold
    ? 'linear-gradient(135deg, #ECC86A 0%, #BA8E2F 50%, #7C5D19 100%)'
    : isSilver
    ? 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 50%, #475569 100%)'
    : 'rgba(255,255,255,0.08)';

  const traceColor = isGold ? '#5C4410' : isSilver ? '#334155' : accentColor;
  const borderColor = isGold ? '#F3D482' : isSilver ? '#CBD5E1' : accentColor;

  return (
    <div
      style={{
        width: 38,
        height: 28,
        borderRadius: 5,
        background: baseGradient,
        border: `1px solid ${borderColor}`,
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4), 0 2px 6px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      aria-label="EMV Smart Chip"
    >
      {/* Chip micro-traces */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            linear-gradient(90deg, transparent 48%, ${traceColor} 48%, ${traceColor} 52%, transparent 52%),
            linear-gradient(0deg, transparent 48%, ${traceColor} 48%, ${traceColor} 52%, transparent 52%)
          `,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '25%',
          bottom: '25%',
          left: '20%',
          right: '20%',
          border: `1px solid ${traceColor}`,
          borderRadius: 3,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

// ── Realistic Code128 Barcode Generator ───────────────────────────────────────
function renderBarcodeLines(seedText: string) {
  // Deterministic bar widths based on seed string
  const bars: { width: number; space: number }[] = [];
  const clean = (seedText || 'METRO8842').toUpperCase();
  for (let i = 0; i < 28; i++) {
    const code = clean.charCodeAt(i % clean.length) + i;
    bars.push({
      width: (code % 3) + 1,
      space: ((code >> 2) % 2) + 1,
    });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', height: 26, gap: 1, background: '#fff', padding: '2px 4px', borderRadius: 2 }}>
      {bars.map((b, i) => (
        <React.Fragment key={i}>
          <div style={{ width: b.width, background: '#000', flexShrink: 0 }} />
          <div style={{ width: b.space, background: '#fff', flexShrink: 0 }} />
        </React.Fragment>
      ))}
    </div>
  );
}

// ── QR Code Simulation Matrix ─────────────────────────────────────────────────
function renderQRMatrix(accentColor: string) {
  return (
    <div
      style={{
        width: 52,
        height: 52,
        background: '#FFFFFF',
        padding: 4,
        borderRadius: 6,
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 2,
        flexShrink: 0,
      }}
      aria-label="Member QR Verification"
    >
      {/* 25 cell mini matrix mimicking scannable QR */}
      {Array.from({ length: 25 }).map((_, i) => {
        // Corners and center pattern
        const isCorner = i === 0 || i === 4 || i === 20 || i === 24 || i === 6 || i === 8 || i === 12 || i === 16 || i === 18;
        const isFilled = isCorner || (i * 7 + 3) % 4 === 0;
        return (
          <div
            key={i}
            style={{
              background: isFilled ? '#09090B' : '#FFFFFF',
              borderRadius: isCorner ? 1 : 0,
            }}
          />
        );
      })}
    </div>
  );
}

export function InteractiveFlipCard({
  design = DEFAULT_STORE_CARD_DESIGN,
  memberName = 'RAHUL SHARMA',
  cardNumber = '•••• •••• •••• 8842',
  validThru = '12/28',
  tier,
  points,
  qrValue = 'https://metrocardz.in/m/SAL001',
  isFlipped: controlledFlipped,
  onFlip,
  interactive = true,
  size = 'responsive',
  showPrintGuides = false,
  className = '',
}: InteractiveFlipCardProps) {
  const [internalFlipped, setInternalFlipped] = useState(false);
  const isFlipped = controlledFlipped !== undefined ? controlledFlipped : internalFlipped;

  const toggleFlip = () => {
    if (!interactive) return;
    const next = !isFlipped;
    setInternalFlipped(next);
    onFlip?.(next);
  };

  // Dimensions based on size
  const maxWidth =
    size === 'sm' ? 290 : size === 'md' ? 380 : size === 'lg' ? 460 : 440;

  // Background gradient resolution
  const getBackgroundStyle = () => {
    if (design.backgroundImageUrl) {
      return `url("${design.backgroundImageUrl}") center / cover no-repeat`;
    }
    const { primaryColor, secondaryColor, gradientDirection } = design;
    switch (gradientDirection) {
      case 'radial':
        return `radial-gradient(ellipse at 30% 25%, ${secondaryColor} 0%, ${primaryColor} 75%)`;
      case 'linear-horizontal':
        return `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
      case 'mesh':
        return `radial-gradient(at 10% 20%, ${secondaryColor} 0px, transparent 50%), radial-gradient(at 90% 80%, ${primaryColor} 0px, transparent 50%), linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`;
      case 'linear-diagonal':
      default:
        return `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`;
    }
  };

  // Texture finish overlay
  const getFinishOverlay = () => {
    switch (design.finish) {
      case 'brushed_metal':
        return 'repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)';
      case 'carbon_weave':
        return 'repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 2px, transparent 2px, transparent 4px)';
      case 'matte_leather':
        return 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 0)';
      case 'gloss_luxe':
      default:
        return 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 45%, transparent 60%, rgba(255,255,255,0.06) 100%)';
    }
  };

  // Foil border styling
  const getBorderStyle = () => {
    switch (design.foilBorder) {
      case 'gold':
        return {
          border: '1px solid rgba(212, 175, 55, 0.75)',
          boxShadow: '0 0 28px rgba(212, 175, 55, 0.22), 0 20px 45px rgba(0, 0, 0, 0.65)',
        };
      case 'rose_gold':
        return {
          border: '1px solid rgba(253, 164, 175, 0.75)',
          boxShadow: '0 0 28px rgba(253, 164, 175, 0.22), 0 20px 45px rgba(0, 0, 0, 0.65)',
        };
      case 'platinum':
        return {
          border: '1px solid rgba(226, 232, 240, 0.75)',
          boxShadow: '0 0 28px rgba(226, 232, 240, 0.2), 0 20px 45px rgba(0, 0, 0, 0.65)',
        };
      case 'neon':
        return {
          border: `1.5px solid ${design.accentColor}`,
          boxShadow: `0 0 32px ${design.accentColor}33, 0 20px 45px rgba(0, 0, 0, 0.7)`,
        };
      case 'none':
      default:
        return {
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.55)',
        };
    }
  };

  // Tier Badge style
  const renderTierBadge = () => {
    const tierText = (tier || design.tierLabel || 'VIP').toUpperCase();
    switch (design.tierBadgeStyle) {
      case 'auric_pill':
        return (
          <span
            style={{
              background: `linear-gradient(135deg, ${design.accentColor} 0%, #D4AF37 100%)`,
              color: '#09090B',
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.08em',
              padding: '3px 9px',
              borderRadius: 999,
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {tierText}
          </span>
        );
      case 'glass_frosted':
        return (
          <span
            style={{
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: `1px solid ${design.accentColor}`,
              color: design.accentColor,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 8,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {tierText}
          </span>
        );
      case 'minimal_border':
        return (
          <span
            style={{
              border: `1px solid ${design.accentColor}`,
              color: design.accentColor,
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: '0.1em',
              padding: '2px 7px',
              borderRadius: 4,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {tierText}
          </span>
        );
      case 'solid_accent':
      default:
        return (
          <span
            style={{
              background: design.accentColor,
              color: '#09090B',
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.08em',
              padding: '3px 8px',
              borderRadius: 6,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {tierText}
          </span>
        );
    }
  };

  const borderCfg = getBorderStyle();

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        width: '100%',
        maxWidth,
        margin: '0 auto',
        perspective: 1200,
      }}
    >
      {/* Print Guides Overlay (Shows CR-80 card standard specs for manufacturing) */}
      {showPrintGuides && (
        <div
          style={{
            position: 'absolute',
            top: -24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#64748B',
            zIndex: 10,
          }}
        >
          <span>CR80: 85.60 mm × 53.98 mm</span>
          <span>CORNER RADIUS: 3.18 mm</span>
          <span>300 DPI</span>
        </div>
      )}

      {/* 3D Flippable Card Frame */}
      <div
        onClick={toggleFlip}
        style={{
          width: '100%',
          aspectRatio: '1.586 / 1',
          position: 'relative',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.65s cubic-bezier(0.2, 0.85, 0.32, 1.2)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          cursor: interactive ? 'pointer' : 'default',
        }}
        role="button"
        tabIndex={0}
        aria-label={`${design.brandName} ${design.tierLabel} card for ${memberName}. Click to flip.`}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            CARD FRONT FACE
            ═══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: getBackgroundStyle(),
            ...borderCfg,
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 18px',
          }}
        >
          {/* Surface Texture Finish Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: getFinishOverlay(),
              borderRadius: 'inherit',
              pointerEvents: 'none',
            }}
          />

          {/* Top Bar: Brand Logo + Brand Name + Tier Badge */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              {/* Logo container */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${design.accentColor}55`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {design.logoType === 'custom_image' && design.customLogoUrl ? (
                  <img
                    src={design.customLogoUrl}
                    alt={design.brandName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  renderPresetIcon(design.presetIcon || 'crown', design.accentColor)
                )}
              </div>

              {/* Brand Typography */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: '"Syne", "Inter", sans-serif',
                    fontSize: 13,
                    fontWeight: 800,
                    color: design.textColor || '#FFFFFF',
                    letterSpacing: '0.04em',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {design.brandName}
                </div>
                <div
                  style={{
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    fontSize: 9,
                    color: design.accentColor,
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                    marginTop: 2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {design.subtitle}
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div style={{ flexShrink: 0 }}>
              {renderTierBadge()}
            </div>
          </div>

          {/* Middle Row: Smart Chip + Contactless NFC Icon */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* EMV Chip */}
              {renderSmartChip(design.chipStyle, design.accentColor)}

              {/* NFC Contactless Icon */}
              {design.showNfcIcon && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: 0.85 }} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M8 12c0-2.21 1.79-4 4-4" stroke={design.accentColor} strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M5 12c0-3.87 3.13-7 7-7" stroke={design.accentColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.65" />
                    <path d="M2 12c0-5.52 4.48-10 10-10" stroke={design.accentColor} strokeWidth="1.6" strokeLinecap="round" opacity="0.35" />
                    <circle cx="12" cy="12" r="2" fill={design.accentColor} />
                  </svg>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
                    NFC
                  </span>
                </div>
              )}
            </div>

            {/* Loyalty points chip on front (if available) */}
            {points !== undefined && (
              <div
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '3px 8px',
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 900, color: design.accentColor, fontFamily: 'monospace' }}>
                  {points.toLocaleString()}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>PTS</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Embossed Card Number, Cardholder Name & Expiry */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            {/* Card Number */}
            <div
              style={{
                fontFamily: '"Space Mono", "Courier New", monospace',
                fontSize: 14,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.14em',
                marginBottom: 6,
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {cardNumber}
            </div>

            {/* Name & Valid Thru */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
              {design.showCardholderName && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                    CARDHOLDER
                  </div>
                  <div
                    style={{
                      fontFamily: '"Syne", "Inter", sans-serif',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#FFFFFF',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {memberName}
                  </div>
                </div>
              )}

              {design.showExpiry && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em' }}>
                    {design.expiryLabel || 'VALID THRU'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 11,
                      fontWeight: 800,
                      color: design.accentColor,
                    }}
                  >
                    {validThru || design.defaultExpiryValue}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Flip Hint */}
          {interactive && (
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                right: 10,
                fontSize: 8,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                letterSpacing: '0.04em',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <span>TAP TO FLIP</span>
              <span>↻</span>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CARD BACK FACE
            ═══════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background: getBackgroundStyle(),
            ...borderCfg,
            overflow: 'hidden',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingBottom: 10,
          }}
        >
          {/* Surface Texture Finish Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: getFinishOverlay(),
              borderRadius: 'inherit',
              pointerEvents: 'none',
            }}
          />

          {/* Magnetic Stripe along top edge */}
          {design.magneticStripe && (
            <div
              style={{
                width: '100%',
                height: 36,
                background: '#09090B',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                position: 'relative',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
              }}
            >
              {/* Gloss reflection line on magnetic stripe */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)',
                }}
              />
            </div>
          )}

          {/* Back Body: Signature strip + Scannable Barcode & QR */}
          <div style={{ padding: '0 16px', position: 'relative', zIndex: 2 }}>
            {/* Signature Panel */}
            {design.signatureStrip && (
              <div style={{ marginBottom: 8 }}>
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 4,
                    height: 26,
                    padding: '2px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px dashed #CBD5E1',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: '"Brush Script MT", "Caveat", cursive, sans-serif',
                      fontSize: 14,
                      color: '#0F172A',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {memberName}
                  </span>
                  <span style={{ fontSize: 7, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em' }}>
                    AUTHORIZED SIGNATURE
                  </span>
                </div>
              </div>
            )}

            {/* Barcode & QR Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {/* Barcode representation */}
              {design.showBarcode && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  {renderBarcodeLines(cardNumber)}
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 8,
                      color: '#E2E8F0',
                      letterSpacing: '0.12em',
                      marginTop: 2,
                      textAlign: 'center',
                    }}
                  >
                    {cardNumber.replace(/\s+/g, '')}
                  </div>
                </div>
              )}

              {/* QR Code representation */}
              {design.showQrCode && (
                <div style={{ flexShrink: 0 }}>
                  {renderQRMatrix(design.accentColor)}
                </div>
              )}
            </div>

            {/* Terms & Conditions (compact) */}
            <div
              style={{
                fontSize: 7.5,
                lineHeight: 1.25,
                color: 'rgba(255,255,255,0.65)',
                marginTop: 6,
                maxHeight: 34,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {design.termsText}
            </div>
          </div>

          {/* Back Footer: Helplines & Metro Cardz Co-branding */}
          <div
            style={{
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 8,
              color: 'rgba(255,255,255,0.7)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 4,
              marginTop: 4,
            }}
          >
            <div>
              <span>Helpline: </span>
              <strong style={{ color: design.accentColor }}>{design.helplinePhone}</strong>
            </div>

            {design.coBrandingBadge && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, letterSpacing: '0.06em' }}>
                <span style={{ color: '#EA580C' }}>⚡</span>
                <span style={{ color: '#F8FAFC' }}>METRO CARDZ NETWORK</span>
              </div>
            )}
          </div>

          {/* Interactive Flip Hint */}
          {interactive && (
            <div
              style={{
                position: 'absolute',
                bottom: 4,
                right: 12,
                fontSize: 8,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                pointerEvents: 'none',
              }}
            >
              <span>↺ TAP FOR FRONT</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
