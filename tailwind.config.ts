import type { Config } from 'tailwindcss';

/**
 * CHARBON — design system tokens.
 * Source de vérité visuelle : captures officielles de l'application.
 * Ratio cible : ~75 % noir / ~20 % blanc-gris / ~5 % orange.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '2rem',
        lg: '3rem',
      },
    },
    extend: {
      colors: {
        /* Noirs profonds & graphite */
        coal: {
          950: '#000000',
          900: '#050505',
          850: '#0A0A0A',
          800: '#0E0E0E',
          750: '#121212',
          700: '#161616',
          600: '#1C1C1B',
          500: '#232322',
        },
        /* Hairlines & bordures */
        line: {
          soft: '#161615',
          DEFAULT: '#1F1F1E',
          strong: '#2C2C2A',
        },
        /* Blanc cassé & gris neutres */
        ink: {
          100: '#F6F5F2',
          200: '#E6E4E0',
          300: '#C9C7C3',
          400: '#A6A4A0',
          500: '#8B8986',
          /* #757370 : ≥ 4.5:1 sur noir pour les micro-textes */
          600: '#757370',
          700: '#52504E',
        },
        /* Orange braise — le signal */
        ember: {
          300: '#FF9057',
          400: '#FF6A1A',
          500: '#F85404',
          600: '#E04A00',
          700: '#B93A00',
          800: '#7A2800',
          900: '#3D1500',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        /* Type scale — site */
        'display-xl': ['clamp(2.75rem, 6.5vw, 5.25rem)', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '500' }],
        'display-lg': ['clamp(2.1rem, 4.6vw, 3.6rem)', { lineHeight: '1.06', letterSpacing: '-0.025em', fontWeight: '500' }],
        'display-md': ['clamp(1.6rem, 3vw, 2.35rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '500' }],
        'body-lg': ['clamp(1.05rem, 1.4vw, 1.25rem)', { lineHeight: '1.65', letterSpacing: '-0.01em' }],
        label: ['0.72rem', { lineHeight: '1.2', letterSpacing: '0.22em', fontWeight: '500' }],
      },
      maxWidth: {
        container: '75rem',
        prose: '42rem',
      },
      borderRadius: {
        pill: '999px',
        sheet: '1.75rem',
        phone: '3.25rem',
        screen: '2.75rem',
      },
      letterSpacing: {
        label: '0.22em',
        wide2: '0.14em',
      },
      transitionTimingFunction: {
        ember: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        400: '400ms',
        600: '600ms',
        800: '800ms',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-up': {
          from: { opacity: '0', transform: 'translateY(24px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: {
        'fade-up': 'fade-up 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'sheet-up': 'sheet-up 380ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-dot': 'pulse-dot 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
