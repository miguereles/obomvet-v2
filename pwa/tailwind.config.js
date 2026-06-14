/** @type {import('tailwindcss').Config} */

// Importa o tema padrão para que a fonte 'sans' continue disponível como fallback
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    // ✅ EXTEND: Adiciona a nova família de fontes
    extend: {
      fontFamily: {
        // Nome da classe Tailwind (font-logo) : Nome da fonte definida no @font-face (KamberLogo)
        logo: ['KamberLogo', ...defaultTheme.fontFamily.sans], 
      },
    },
  },
  plugins: [],
};