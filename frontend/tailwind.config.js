/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        jojo: ['"Bangers"', 'cursive'],
        body: ['"Comic Neue"', 'cursive'],
      },
      colors: {
        jojo: {
          gold: '#FFD700',
          purple: '#6B21A8',
          darkPurple: '#3B0764',
          pink: '#EC4899',
          red: '#DC2626',
          blue: '#1E40AF',
          dark: '#1A0A2E',
          orange: '#F97316',
        },
      },
      keyframes: {
        menacing: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
          '50%': { transform: 'scale(1.05) rotate(-1deg)' },
        },
      },
      animation: {
        menacing: 'menacing 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
