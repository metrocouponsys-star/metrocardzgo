/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Premium Warm Palette ─────────────────────────────────────────────
        // Primary — Deep navy (warm undertone)
        'primary':               '#0A1628',
        'on-primary':            '#ffffff',
        'primary-container':     '#1E293B',
        'on-primary-container':  '#94A3B8',
        'primary-fixed':         '#dce1ff',
        'primary-fixed-dim':     '#b6c4ff',
        'on-primary-fixed':      '#00164e',
        'on-primary-fixed-variant': '#264191',

        // Accent — Vibrant coral-orange
        'accent':                '#FF6B35',
        'accent-light':          '#FF8F62',
        'accent-soft':           '#FFF0EB',
        'accent-hover':          '#E85A28',
        'on-accent':             '#ffffff',

        // Secondary — Electric teal (success/rewards)
        'secondary':             '#00D4AA',
        'on-secondary':          '#003D32',
        'secondary-container':   '#E0FFF6',
        'on-secondary-container':'#006B55',
        'secondary-fixed':       '#6ffbbe',
        'secondary-fixed-dim':   '#4edea3',
        'on-secondary-fixed':    '#002113',
        'on-secondary-fixed-variant': '#005236',

        // Tertiary — Warm amber
        'tertiary':              '#F59E0B',
        'on-tertiary':           '#451A03',
        'tertiary-container':    '#FEF3C7',
        'on-tertiary-container': '#92400E',
        'tertiary-fixed':        '#ffdbcb',
        'tertiary-fixed-dim':    '#ffb691',
        'on-tertiary-fixed':     '#341100',
        'on-tertiary-fixed-variant': '#773205',

        // Error
        'error':                 '#EF4444',
        'on-error':              '#ffffff',
        'error-container':       '#FEF2F2',
        'on-error-container':    '#991B1B',

        // Surface hierarchy — Warm whites
        'surface':               '#F8FAFC',
        'on-surface':            '#0F172A',
        'surface-variant':       '#E2E8F0',
        'on-surface-variant':    '#64748B',
        'surface-dim':           '#E2E8F0',
        'surface-bright':        '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F8FAFC',
        'surface-container':     '#F1F5F9',
        'surface-container-high':'#E2E8F0',
        'surface-container-highest': '#CBD5E1',
        'surface-tint':          '#FF6B35',

        // Outline
        'outline':               '#94A3B8',
        'outline-variant':       '#E2E8F0',

        // Background
        'background':            '#F8FAFC',
        'on-background':         '#0F172A',

        // Inverse
        'inverse-surface':       '#1E293B',
        'inverse-on-surface':    '#F1F5F9',
        'inverse-primary':       '#FF8F62',

        // Status colors
        'amber': {
          50: '#fffbeb', 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        },
        'gold': {
          DEFAULT: '#C9A227', light: '#D4AF37', lighter: '#FDF6E3', dark: '#7A5C12',
          glow: 'rgba(201,162,39,0.35)',
        },
        'rich-black':     '#0D0D0D',
        'card-dark':      '#111111',
        'emerald-dark':   '#0B3D2E',
        'maroon':         '#5C1A2E',
        'warm-white':     '#FAF7EF',
        'warm-grey':      '#8A8A8A',
        'expiring':       '#d97706',
        'expiring-bg':    '#fef3c7',
        'success':        '#00D4AA',
        'success-bg':     '#E0FFF633',

        // Sidebar
        'sidebar':        '#0F172A',
        'sidebar-hover':  '#1E293B',
        'sidebar-active': '#FF6B35',
        'sidebar-text':   '#94A3B8',
        'sidebar-text-active': '#FFFFFF',

        // ── Metro Obsidian Gold — Deals Platform Design System ────────────────
        'obs': {
          canvas: '#0D0F12', surface: '#14171F', elevated: '#1C212B',
          highlight: '#222936', border: '#2A303C', 'auric-border': '#3F3722',
        },
        'auric': {
          DEFAULT: '#D4AF37', champagne: '#E5C158', amber: '#F59E0B',
          specular: '#FFF3D6', dim: '#E9C349',
        },
        'obs-text': {
          primary: '#FFFFFF', secondary: '#F8FAFC', muted: '#9CA3AF', faded: '#6B7280',
        },
        'partner-public': '#9CA3AF', 'partner-affiliate': '#E5C158',
        'partner-authorised': '#34D399', 'partner-direct': '#FFF3D6',
      },

      borderRadius: {
        DEFAULT: '0.375rem',
        lg: '0.625rem',
        xl: '0.875rem',
        '2xl': '1.125rem',
        '3xl': '1.5rem',
        full: '9999px',
      },

      spacing: {
        xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px',
        gutter: '16px',
        'container-margin-mobile': '16px',
        'container-margin-desktop': '40px',
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', '"JetBrains Mono"', '"Space Mono"', 'monospace'],
      },

      fontSize: {
        'body-sm':  ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'body-md':  ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'body-lg':  ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '600' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'headline-sm': ['18px', { lineHeight: '26px', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'headline-lg': ['28px', { lineHeight: '36px', letterSpacing: '-0.02em', fontWeight: '800' }],
        'headline-lg-mobile': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        // Deals type scale
        'display-hero':        ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-hero-mobile': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl':         ['32px', { lineHeight: '40px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'headline-xl-mobile':  ['26px', { lineHeight: '34px', letterSpacing: '-0.015em', fontWeight: '600' }],
        'deals-headline-lg':   ['22px', { lineHeight: '30px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'deals-headline-md':   ['18px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '600' }],
        'badge-micro':         ['10px', { lineHeight: '12px', letterSpacing: '0.06em', fontWeight: '700' }],
        'label-caps':          ['11px', { lineHeight: '14px', letterSpacing: '0.08em', fontWeight: '700' }],
      },

      boxShadow: {
        // Warm shadow tiers
        'card':       '0 1px 3px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.03)',
        'card-hover': '0 4px 16px rgba(15,23,42,0.08), 0 12px 32px rgba(15,23,42,0.04)',
        'elevated':   '0 8px 30px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04)',
        'dialog':     '0 24px 48px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.05)',
        'nav':        '0 -2px 20px rgba(15,23,42,0.06), 0 -1px 4px rgba(15,23,42,0.03)',
        'tonal':      '0 2px 4px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.02)',
        'glow-accent': '0 0 20px rgba(255,107,53,0.15), 0 4px 16px rgba(255,107,53,0.1)',
        'glow-teal':   '0 0 20px rgba(0,212,170,0.15), 0 4px 16px rgba(0,212,170,0.1)',
        'inner':       'inset 0 2px 4px rgba(15,23,42,0.04)',
        // Deals elevation shadows
        'obs-card':     '0 0 0 1px #2A303C',
        'obs-elevated': '0 8px 32px -4px rgba(0,0,0,0.6)',
        'obs-modal':    '0 24px 48px -8px rgba(0,0,0,0.85)',
        'auric-glow':   '0 0 20px -2px rgba(212,175,55,0.25)',
        'auric-hero':   '0 0 32px 2px rgba(229,193,88,0.2)',
        'gold-focus':   '0 0 0 3px rgba(212,175,55,0.15)',
        'auric-button': '0 4px 16px rgba(212,175,55,0.3)',
      },

      animation: {
        'fade-in':       'fadeIn 0.35s ease-out both',
        'slide-up':      'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in':      'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'scan':          'scan 2s infinite linear',
        'pulse-dot':     'pulseDot 2s infinite',
        'marquee':       'marquee 30s linear infinite',
        'marquee-reverse': 'marqueeReverse 30s linear infinite',
        'float':         'float 6s ease-in-out infinite',
        'shimmer':       'shimmer 2.5s linear infinite',
        'draw-line':     'drawLine 1s ease-out forwards',
        'glow-pulse':    'glowPulse 2s ease-in-out infinite',
        'spring-in':     'springIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'count-up':      'countUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shake':         'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        // Deals animations
        'nfc-breathe':   'nfcBreathe 2.5s ease-in-out infinite',
        'auric-pulse':   'auricPulse 2s ease-in-out infinite',
        'gold-shimmer':  'goldShimmer 2.5s linear infinite',
        'card-reveal':   'cardReveal 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },

      keyframes: {
        fadeIn:      { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:     { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:     { from: { opacity: '0', transform: 'scale(0.92)' }, to: { opacity: '1', transform: 'scale(1)' } },
        springIn:    { '0%': { opacity: '0', transform: 'scale(0.85) translateY(10px)' }, '60%': { opacity: '1', transform: 'scale(1.02) translateY(-2px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        countUp:     { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shake:       { '10%, 90%': { transform: 'translateX(-1px)' }, '20%, 80%': { transform: 'translateX(2px)' }, '30%, 50%, 70%': { transform: 'translateX(-3px)' }, '40%, 60%': { transform: 'translateX(3px)' } },
        scan:        { '0%': { top: '0%' }, '100%': { top: '100%' } },
        pulseDot:    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        marquee:     { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        marqueeReverse: { '0%': { transform: 'translateX(-50%)' }, '100%': { transform: 'translateX(0)' } },
        float:       { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer:     { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        drawLine:    { from: { strokeDashoffset: '1000' }, to: { strokeDashoffset: '0' } },
        glowPulse:   { '0%, 100%': { boxShadow: '0 0 20px rgba(201,162,39,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(201,162,39,0.7)' } },
        nfcBreathe:  {
          '0%, 100%': { boxShadow: '0 0 16px 2px rgba(212,175,55,0.15)', borderColor: 'rgba(212,175,55,0.4)' },
          '50%':      { boxShadow: '0 0 32px 6px rgba(229,193,88,0.35)', borderColor: 'rgba(229,193,88,0.8)' },
        },
        auricPulse:  { '0%, 100%': { opacity: '0.7' }, '50%': { opacity: '1' } },
        goldShimmer: { '0%': { backgroundPosition: '-200% center' }, '100%': { backgroundPosition: '200% center' } },
        cardReveal:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
