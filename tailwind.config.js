/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Breakpoints otimizados para mobile
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      // Animações otimizadas
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce-subtle 2s infinite',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Espaçamentos otimizados para touch
      spacing: {
        'touch': '44px', // Tamanho mínimo recomendado para touch targets
      },
    },
  },
  plugins: [],
  // Otimizações de performance
  future: {
    hoverOnlyWhenSupported: true, // Aplica hover apenas em dispositivos que suportam
  },
  // Purge otimizado
  safelist: [
    // Cores dinâmicas que podem ser usadas
    {
      pattern: /^(bg|text|border)-(cyan|purple|pink|red|green|yellow|blue)-(400|500|600)/,
    },
  ],
};
