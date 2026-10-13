// ─────────────────────────────────────────────────────────────────────────────
// Card Design Configuration Types & Industry Presets
// For Merchant Self-Serve Card Designer Studio & Customer Interactive Passes
// ─────────────────────────────────────────────────────────────────────────────

export type CardScope = 'store_loyalty' | 'go_pass';

export type CardThemeId =
  | 'obsidian_gold'
  | 'sapphire_luxe'
  | 'emerald_elite'
  | 'rosegold_velvet'
  | 'carbon_stealth'
  | 'cyber_platinum'
  | 'amethyst_royale'
  | 'sunset_crimson'
  | 'custom';

export type CardFinish = 'brushed_metal' | 'carbon_weave' | 'matte_leather' | 'gloss_luxe';
export type ChipStyle = 'gold_emv' | 'silver_emv' | 'minimal_wire' | 'none';
export type FoilBorder = 'gold' | 'rose_gold' | 'platinum' | 'neon' | 'none';
export type GradientDirection = 'linear-diagonal' | 'linear-horizontal' | 'radial' | 'mesh';
export type TierBadgeStyle = 'auric_pill' | 'glass_frosted' | 'minimal_border' | 'solid_accent';
export type PresetIconId = 'crown' | 'diamond' | 'star' | 'scissors' | 'cutlery' | 'shield' | 'flame' | 'monogram';

export interface CardDesignConfig {
  id?: string;
  scope: CardScope; // 'store_loyalty' | 'go_pass'
  themeId: CardThemeId;

  // Colors & Gradients
  primaryColor: string;       // e.g. '#0D0F12'
  secondaryColor: string;     // e.g. '#1C212B'
  accentColor: string;        // e.g. '#D4AF37'
  textColor: string;          // e.g. '#FFFFFF'
  gradientDirection: GradientDirection;
  finish: CardFinish;
  foilBorder: FoilBorder;

  // Smart Chip & Hardware Aesthetics
  chipStyle: ChipStyle;
  showNfcIcon: boolean;

  // Brand Identity
  brandName: string;
  subtitle: string;
  logoType: 'custom_image' | 'preset_icon';
  customLogoUrl?: string;
  presetIcon?: PresetIconId;

  // Tier Badge
  tierLabel: string;
  tierBadgeStyle: TierBadgeStyle;

  // Front Typography & Display
  showCardholderName: boolean;
  showExpiry: boolean;
  expiryLabel: string;
  defaultExpiryValue: string;

  // Back Face
  magneticStripe: boolean;
  showBarcode: boolean;
  showQrCode: boolean;
  signatureStrip: boolean;
  termsText: string;
  helplinePhone: string;
  helplineWhatsapp: string;
  addressText: string;
  websiteText: string;
  coBrandingBadge: boolean;

  updatedAt?: string;
}

// ── Curated Luxury Theme Presets ──────────────────────────────────────────────
export interface ThemePresetMeta {
  id: CardThemeId;
  name: string;
  category: string;
  description: string;
  config: Partial<CardDesignConfig>;
}

export const THEME_PRESETS: ThemePresetMeta[] = [
  {
    id: 'obsidian_gold',
    name: 'Obsidian & 24K Gold',
    category: 'Black Card Signature',
    description: 'Ultra-luxury deep radial obsidian with 24K gold foil trim & gold EMV chip.',
    config: {
      primaryColor: '#0D0F12',
      secondaryColor: '#1C212B',
      accentColor: '#D4AF37',
      textColor: '#FFFFFF',
      gradientDirection: 'radial',
      finish: 'brushed_metal',
      foilBorder: 'gold',
      chipStyle: 'gold_emv',
      tierBadgeStyle: 'auric_pill',
      tierLabel: 'VIP GOLD',
    },
  },
  {
    id: 'sapphire_luxe',
    name: 'Royal Sapphire',
    category: 'Boutique & Concierge',
    description: 'Midnight navy blue with platinum chrome reflection and silver chip.',
    config: {
      primaryColor: '#0A192F',
      secondaryColor: '#1E3A8A',
      accentColor: '#38BDF8',
      textColor: '#FFFFFF',
      gradientDirection: 'linear-diagonal',
      finish: 'gloss_luxe',
      foilBorder: 'platinum',
      chipStyle: 'silver_emv',
      tierBadgeStyle: 'glass_frosted',
      tierLabel: 'SAPPHIRE ELITE',
    },
  },
  {
    id: 'emerald_elite',
    name: 'Emerald Heritage',
    category: 'Hospitality & Dining',
    description: 'Deep forest emerald green with champagne gold trim and warm accents.',
    config: {
      primaryColor: '#022C22',
      secondaryColor: '#065F46',
      accentColor: '#FDE047',
      textColor: '#FFFFFF',
      gradientDirection: 'linear-diagonal',
      finish: 'brushed_metal',
      foilBorder: 'gold',
      chipStyle: 'gold_emv',
      tierBadgeStyle: 'auric_pill',
      tierLabel: 'EMERALD CLUB',
    },
  },
  {
    id: 'rosegold_velvet',
    name: 'Rose Gold Velvet',
    category: 'Salon, Spa & Couture',
    description: 'Soft burgundy noir with rose gold metallic foil trim and satin finish.',
    config: {
      primaryColor: '#2B091E',
      secondaryColor: '#581C3F',
      accentColor: '#FDA4AF',
      textColor: '#FFFFFF',
      gradientDirection: 'linear-diagonal',
      finish: 'matte_leather',
      foilBorder: 'rose_gold',
      chipStyle: 'gold_emv',
      tierBadgeStyle: 'glass_frosted',
      tierLabel: 'VELVET PRIVILEGE',
    },
  },
  {
    id: 'carbon_stealth',
    name: 'Carbon Stealth',
    category: 'Fitness & Automotive',
    description: 'Matte carbon fiber mesh with tactical cyber amber accents and wire chip.',
    config: {
      primaryColor: '#09090B',
      secondaryColor: '#18181B',
      accentColor: '#F59E0B',
      textColor: '#F4F4F5',
      gradientDirection: 'mesh',
      finish: 'carbon_weave',
      foilBorder: 'neon',
      chipStyle: 'minimal_wire',
      tierBadgeStyle: 'solid_accent',
      tierLabel: 'STEALTH PRO',
    },
  },
  {
    id: 'cyber_platinum',
    name: 'Titanium Platinum',
    category: 'Corporate & Founders',
    description: 'Brushed titanium slate with iridescent platinum edge and silver EMV.',
    config: {
      primaryColor: '#1E293B',
      secondaryColor: '#334155',
      accentColor: '#E2E8F0',
      textColor: '#FFFFFF',
      gradientDirection: 'linear-diagonal',
      finish: 'gloss_luxe',
      foilBorder: 'platinum',
      chipStyle: 'silver_emv',
      tierBadgeStyle: 'minimal_border',
      tierLabel: 'FOUNDER PASS',
    },
  },
  {
    id: 'amethyst_royale',
    name: 'Imperial Amethyst',
    category: 'Lifestyle & Nightlife',
    description: 'Deep royal purple with lavender neon glow and futuristic finish.',
    config: {
      primaryColor: '#1E1035',
      secondaryColor: '#4C1D95',
      accentColor: '#C084FC',
      textColor: '#FFFFFF',
      gradientDirection: 'linear-diagonal',
      finish: 'gloss_luxe',
      foilBorder: 'neon',
      chipStyle: 'gold_emv',
      tierBadgeStyle: 'glass_frosted',
      tierLabel: 'IMPERIAL PASS',
    },
  },
  {
    id: 'sunset_crimson',
    name: 'Sunset Terracotta',
    category: 'Artisanal & Coffee',
    description: 'Warm terracotta sunset gradient with champagne gold highlights.',
    config: {
      primaryColor: '#431407',
      secondaryColor: '#9A3412',
      accentColor: '#FDE047',
      textColor: '#FFFFFF',
      gradientDirection: 'linear-diagonal',
      finish: 'brushed_metal',
      foilBorder: 'gold',
      chipStyle: 'gold_emv',
      tierBadgeStyle: 'auric_pill',
      tierLabel: 'PRESTIGE CLUB',
    },
  },
];

// ── Default Store Membership Card Configuration ──────────────────────────────
export const DEFAULT_STORE_CARD_DESIGN: CardDesignConfig = {
  scope: 'store_loyalty',
  themeId: 'obsidian_gold',
  primaryColor: '#0D0F12',
  secondaryColor: '#1C212B',
  accentColor: '#D4AF37',
  textColor: '#FFFFFF',
  gradientDirection: 'radial',
  finish: 'brushed_metal',
  foilBorder: 'gold',
  chipStyle: 'gold_emv',
  showNfcIcon: true,
  brandName: 'METRO LOYALTY CLUB',
  subtitle: 'EXCLUSIVE PRESTIGE MEMBER',
  logoType: 'preset_icon',
  presetIcon: 'crown',
  tierLabel: 'VIP GOLD',
  tierBadgeStyle: 'auric_pill',
  showCardholderName: true,
  showExpiry: true,
  expiryLabel: 'VALID THRU',
  defaultExpiryValue: '12/28',
  magneticStripe: true,
  showBarcode: true,
  showQrCode: true,
  signatureStrip: true,
  termsText:
    '1. This card is non-transferable and remains the property of the issuing merchant.\n2. Present this card or digital pass prior to billing to earn and redeem points.\n3. Benefits and privileges subject to terms at participating outlets.',
  helplinePhone: '+91 98765 43210',
  helplineWhatsapp: '+91 98765 43210',
  addressText: 'MG Road Flagship & All Participating Outlets',
  websiteText: 'www.metrocardz.in',
  coBrandingBadge: true,
};

// ── Default Metro Cardz GO Pass Configuration ────────────────────────────────
export const DEFAULT_GO_CARD_DESIGN: CardDesignConfig = {
  scope: 'go_pass',
  themeId: 'obsidian_gold',
  primaryColor: '#111827',
  secondaryColor: '#EA580C',
  accentColor: '#FDE047',
  textColor: '#FFFFFF',
  gradientDirection: 'linear-diagonal',
  finish: 'brushed_metal',
  foilBorder: 'gold',
  chipStyle: 'gold_emv',
  showNfcIcon: true,
  brandName: 'METRO CARDZ GO',
  subtitle: 'PREMIUM CROSS-BRAND DEAL PASS',
  logoType: 'preset_icon',
  presetIcon: 'star',
  tierLabel: 'GO PRIME',
  tierBadgeStyle: 'auric_pill',
  showCardholderName: true,
  showExpiry: true,
  expiryLabel: 'VALID THRU',
  defaultExpiryValue: '12/28',
  magneticStripe: true,
  showBarcode: true,
  showQrCode: true,
  signatureStrip: true,
  termsText:
    '1. Metro Cardz GO pass entitles member to exclusive dining, amusement & wellness privileges.\n2. Claim discounts on go.metrocardz.in before redemption.\n3. One voucher claim per visit unless specified by partner merchant.',
  helplinePhone: '+91 90000 00000',
  helplineWhatsapp: '+91 90000 00000',
  addressText: 'Valid at 500+ Partner Merchants across Mumbai & Pune',
  websiteText: 'go.metrocardz.in',
  coBrandingBadge: true,
};

// ── Helpers for Storage & Persistence ─────────────────────────────────────────
export function getStorageKey(merchantId: string, scope: CardScope): string {
  return `mc_card_design_${merchantId || 'default'}_${scope}`;
}

export function loadSavedCardDesign(merchantId: string, scope: CardScope = 'store_loyalty'): CardDesignConfig {
  const fallback = scope === 'go_pass' ? DEFAULT_GO_CARD_DESIGN : DEFAULT_STORE_CARD_DESIGN;
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(getStorageKey(merchantId, scope));
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...fallback, ...parsed };
    }
    // Also check global fallback if merchant-specific not found
    const globalRaw = localStorage.getItem(`mc_card_design_global_${scope}`);
    if (globalRaw) {
      return { ...fallback, ...JSON.parse(globalRaw) };
    }
  } catch {
    // Ignore parse errors
  }

  return fallback;
}

export function persistCardDesignLocally(merchantId: string, design: CardDesignConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const data = JSON.stringify({ ...design, updatedAt: new Date().toISOString() });
    localStorage.setItem(getStorageKey(merchantId, design.scope), data);
    // Also save as global fallback for public pages
    localStorage.setItem(`mc_card_design_global_${design.scope}`, data);
  } catch (e) {
    console.error('Failed to save card design to localStorage', e);
  }
}
