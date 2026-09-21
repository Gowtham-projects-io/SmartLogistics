/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    screens: {
      'xs':  '375px',
      'sm':  '430px',
      'md':  '768px',
      'lg':  '1024px',
      'xl':  '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2747',
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#627d98',
          500: '#486581',
          600: '#334e68',
          700: '#243b53',
          800: '#163660',
          900: '#0F2747',
          950: '#08172b',
        },
        primary: {
          DEFAULT: '#0F2747',
          light:   '#163660',
          dark:    '#08172b',
        },
        accent: {
          DEFAULT: '#F59E0B',
          hover:   '#d97706',
          light:   '#fef3c7',
        },
        brand: {
          navy:      '#0F2747',
          orange:    '#F59E0B',
          bg:        '#F1F5F9',
          white:     '#FFFFFF',
          dark:      '#172033',
          secondary: '#64748B',
          success:   '#16A34A',
          danger:    '#DC2626',
          border:    '#E2E8F0',
          // backward compat
          green:     '#16A34A',
          red:       '#DC2626',
          blue:      '#0F2747',
        },
        surface: {
          bg:      '#F1F5F9',
          card:    '#FFFFFF',
          border:  '#E2E8F0',
          dark:    '#172033',
          muted:   '#64748B',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top':    'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left':   'env(safe-area-inset-left)',
        'safe-right':  'env(safe-area-inset-right)',
        'bottom-nav':  '64px',
      },
      animation: {
        'fade-in':     'fadeIn 0.3s ease-out',
        'slide-up':    'slideUp 0.35s ease-out',
        'slide-down':  'slideDown 0.3s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'sheet-up':    'sheetUp 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' },                           to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:{ from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        sheetUp:  { from: { transform: 'translateY(100%)' },          to: { transform: 'translateY(0)' } },
      },
      minHeight: {
        touch: '44px',
      },
      fontSize: {
        'mobile-xs': ['11px', '16px'],
        'mobile-sm': ['13px', '20px'],
        'mobile-base': ['15px', '22px'],
        'mobile-lg': ['17px', '26px'],
        'mobile-xl': ['20px', '28px'],
        'mobile-2xl': ['24px', '32px'],
      },
    },
  },
  plugins: [],
}
