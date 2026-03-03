/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0F172A',
        darker: '#0B1220',
        card: '#111827',
        accent: '#FF3B3B', // Neon Red
        secondary: '#FF6B6B',
        highlight: '#FFFFFF',
        muted: '#9CA3AF',
        borderglow: 'rgba(255,255,255,0.08)',
        gold: '#fbbf24',
        silver: '#94a3b8',
        bronze: '#b45309',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 59, 59, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 59, 59, 0.8), 0 0 40px rgba(255, 59, 59, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
