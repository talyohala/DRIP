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
          black: '#000000',
          titanium: '#1C1C1E',
          graphite: '#2C2C2E',
          cyan: '#0A84FF',
          danger: '#FF453A',
          glass: 'rgba(255, 255, 255, 0.03)',
          glassBorder: 'rgba(255, 255, 255, 0.08)'
        }
      }
    },
  },
  plugins: [],
} satisfies Config
