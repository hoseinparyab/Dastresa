import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tahoma', 'Segoe UI', 'Source Sans 3', 'system-ui', 'sans-serif'],
        display: ['Tahoma', 'Segoe UI', 'Georgia', 'serif'],
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
          muted: '#cbd5e1',
          danger: '#f87171',
          success: '#4ade80',
        },
      },
    },
  },
  plugins: [],
};

export default config;
