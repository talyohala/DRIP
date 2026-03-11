import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        drip: {
          black: '#020202',
          velvet: '#0A0A0C',
          cyan: '#00F0FF',
          danger: '#FF2A5F',
          glass: 'rgba(255, 255, 255, 0.03)',
          glassBorder: 'rgba(255, 255, 255, 0.08)'
        }
      }
    },
  },
  plugins: [],
} satisfies Config
