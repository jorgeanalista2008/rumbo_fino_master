/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'executive-dark': '#0F141C',
        'executive-card': '#1E2530',
        'executive-border': '#2E3846',
        'luxury-gold': '#D4AF37',
        'luxury-gold-hover': '#B59226',
      },
    },
  },
  plugins: [],
};
