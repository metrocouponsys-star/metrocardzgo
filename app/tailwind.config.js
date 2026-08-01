/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Primary accent: desaturated gold (THE one restrained accent) ───────
        'primary': '#B8941F',              // desaturated gold — used for CTA buttons, active states, key numbers
        'on-primary': '#ffffff',
        'primary-container': '#F5EDD0',    // soft gold tint — container backgrounds
        'on-primary-container': '#7A5C12', // dark gold — text on gold tint bg
        'primary-fixed': '#FBF7EA',        // very light gold tint — hover/subtle bg
        'primary-fixed-dim': '#F0E4B8',
        'on-primary-fixed': '#5C4209',
        'on-primary-fixed-variant': '#9A7A18',

        // ─── Secondary: neutral gray — secondary/label text ───────────────────
        'secondary': '#6B7280',
        'on-secondary': '#ffffff',
        'secondary-container': '#F3F4F6',  // light gray container
        'on-secondary-container': '#374151',

        // ─── Tertiary: kept for offer card variety / data viz ─────────────────
        'tertiary': '#4b1c00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#FEF3C7',   // soft amber tint (warm, not harsh)
        'on-tertiary-container': '#92400E',
        'tertiary-fixed': '#FDE68A',
        'tertiary-fixed-dim': '#FCD34D',
        'on-tertiary-fixed': '#451A03',
        'on-tertiary-fixed-variant': '#92400E',

        // ─── Semantic error ────────────────────────────────────────────────────
        'error': '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#fee2e2',      // soft red tint
        'on-error-container': '#991b1b',

        // ─── Surface system: clean white → very light off-white ───────────────
        'surface': '#F7F7F8',              // page background — neutral off-white
        'on-surface': '#111111',           // near-black charcoal — primary text
        'surface-variant': '#E5E7EB',
        'on-surface-variant': '#6B7280',   // medium gray — secondary text
        'surface-dim': '#E5E7EB',
        'surface-bright': '#ffffff',
        'surface-container-lowest': '#ffffff',   // pure white — card surfaces
        'surface-container-low': '#F9FAFB',      // hover state bg
        'surface-container': '#F3F4F6',          // container bg
        'surface-container-high': '#E5E7EB',     // dividers
        'surface-container-highest': '#D1D5DB',
        'surface-tint': '#B8941F',

        // ─── Outline system ────────────────────────────────────────────────────
        'outline': '#9CA3AF',
        'outline-variant': '#E5E7EB',      // very light — used for dividers
        'background': '#F7F7F8',
        'on-background': '#111111',
        'inverse-surface': '#1F2937',
        'inverse-on-surface': '#F9FAFB',
        'inverse-primary': '#F0D58C',

        // ─── Amber scale (UI utility) ──────────────────────────────────────────
        'amber': {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },

        // ─── Landing page palette — DO NOT CHANGE ─────────────────────────────
        'gold': {
          DEFAULT: '#C9A227',   // landing page gold (intentionally kept brighter)
          light:   '#D4AF37',
          lighter: '#FDF6E3',
          dark:    '#7A5C12',
          glow:    'rgba(201,162,39,0.35)',
        },
        'rich-black': '#0D0D0D',
        'card-dark':  '#111111',
        'emerald-dark': '#0B3D2E',
        'maroon':     '#5C1A2E',
        'warm-white': '#FAF7EF',
        'warm-grey':  '#8A8A8A',

        // ─── Semantic status tokens ────────────────────────────────────────────
        'expiring':    '#d97706',      // amber-600 — "expiring soon" foreground
        'expiring-bg': '#fef3c7',      // amber-100 — "expiring soon" badge bg
        'success':     '#059669',      // emerald-600 — active/success foreground
        'success-bg':  '#D1FAE5',      // emerald-100 — success badge bg

        // ─── Neutral gray scale (direct utility use in pages) ──────────────────
        'neutral': {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111111',
        },
      },

      borderRadius: {
        DEFAULT: '0.25rem',
        sm:   '0.375rem',   // 6px
        lg:   '0.5rem',     // 8px
        xl:   '0.75rem',    // 12px  — standard card radius
        '2xl': '1rem',      // 16px
        '3xl': '1.25rem',   // 20px
        full: '9999px',
      },

      spacing: {
        xs:  '4px',
        sm:  '8px',
        md:  '16px',
        lg:  '24px',
        xl:  '32px',
        '2xl': '48px',
        gutter: '16px',
        'container-margin-mobile':  '16px',
        'container-margin-desktop': '40px',
      },

      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },

      fontSize: {
        // App UI type scale
        'label-sm':  ['11px',  { lineHeight: '14px', fontWeight: '500' }],
        'label-md':  ['12px',  { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'body-md':   ['14px',  { lineHeight: '20px', fontWeight: '400' }],
        'body-lg':   ['16px',  { lineHeight: '24px', fontWeight: '400' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        // Premium stat number sizes
        'stat-num':  ['40px', { lineHeight: '48px', fontWeight: '700', letterSpacing: '-0.02em' }],
        'stat-num-lg': ['48px', { lineHeight: '56px', fontWeight: '800', letterSpacing: '-0.03em' }],
      },

      boxShadow: {
        // Replaces hard borders as the primary depth signal
        'tonal':    '0 2px 4px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.02)',
        'elevated': '0 8px 30px rgba(0,0,0,0.08)',
        // NEW premium shadow system
        'card':     '0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)',
        'premium':  '0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.04)',
        'modal':    '0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)',
        'gold-glow': '0 0 0 3px rgba(184,148,31,0.15)',
        'input-focus': '0 0 0 3px rgba(184,148,31,0.15)',
        'nav':      '0 1px 3px rgba(0,0,0,0.04)',
      },

      animation: {
        'fade-in':    'fadeIn 0.4s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'spin-slow':  'spinSlow 1.2s linear infinite',
        'float':      'float 3s ease-in-out infinite',
        'scan':       'scan 2s infinite linear',
        'pulse-dot':  'pulseDot 2s infinite',
        'marquee':    'marquee 30s linear infinite',
        'marquee-reverse': 'marqueeReverse 30s linear infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'draw-line':  'drawLine 1s ease-out forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:      { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        spinSlow:     { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        scan:         { '0%': { top: '0%' }, '100%': { top: '100%' } },
        pulseDot:     { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        marquee:      { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        marqueeReverse: { '0%': { transform: 'translateX(-50%)' }, '100%': { transform: 'translateX(0)' } },
        float:        { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer:      { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        drawLine:     { from: { strokeDashoffset: '1000' }, to: { strokeDashoffset: '0' } },
        glowPulse:    { '0%, 100%': { boxShadow: '0 0 20px rgba(201,162,39,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(201,162,39,0.7)' } },
      },
    },
  },
  plugins: [],
}
