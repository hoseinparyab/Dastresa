import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'Tahoma', 'Segoe UI', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      minWidth: {
        touch: '48px',
      },
      minHeight: {
        touch: '48px',
      },
      transitionDuration: {
        fast: '120ms',
      },
      colors: {
        dastresa: {
          bg: '#0f172a',
          surface: '#1e293b',
          accent: '#38bdf8',
          text: '#f8fafc',
          muted: '#94a3b8',
          danger: '#f87171',
          success: '#4ade80',
        },
      },
    },
  },
  plugins: [],
};

export default config;
