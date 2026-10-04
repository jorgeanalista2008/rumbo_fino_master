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
        // Uber Black / High-Tech Titanium Luxury Palette
        'executive-dark': '#0A0A0C',     // Negro asfalto para los fondos de la plataforma
        'executive-card': '#141418',     // Gris antracita para tarjetas, inputs y filas de tablas
        'executive-elevated': '#1C1C22', // Gris más claro para modales, menús y cabeceras
        'executive-border': '#2C2C32',   // Líneas sutiles de separación
        'executive-border-secondary': '#1C1C22',
        'titanium': '#8E8E93',           // Gris titanio para subtítulos y metadatos
        'platinum': '#F5F5F7',           // Blanco platino para títulos de alto contraste
        'chrome': '#FFFFFF',             // Blanco puro para botones principales
        'chrome-hover': '#E5E5EA',       // Brillo metálico suave al hover
        'luxury-gold': '#FFFFFF',        // Redirigido a Blanco Platino en el tema Uber Black
        'luxury-gold-hover': '#E5E5EA',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '6px',
        xl: '8px',
        '2xl': '10px',
        '3xl': '12px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
