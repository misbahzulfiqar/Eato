/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'] },
      colors: {
        eato: { orange: '#f97316', dark: '#1c1917', cream: '#fef3c7' },
        brand: {
          green: '#1e4d2b',
          greenHover: '#163d24',
          lime: '#8bc34a',
          muted: '#f5f6f4',
          sky: '#e3f2fd',
        },
        fresh: {
          green: '#1e4d2b',
          lime: '#8bc34a',
          muted: '#f5f6f4',
          sky: '#e3f2fd',
        },
      },
    },
  },
  plugins: [],
};
