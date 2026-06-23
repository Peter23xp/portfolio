/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        space: ['"Satoshi"', 'sans-serif'],
        oswald: ['"Clash Display"', 'sans-serif'],
        bricolage: ['"Bricolage Grotesque"', 'sans-serif'],
      },
      // Palette admin — dark violet-tinted, Linear-inspired.
      // Utiliser avec le préfixe `adm-` : bg-adm-bg, text-adm-ink-2, etc.
      colors: {
        adm: {
          bg:             'oklch(0.09 0.008 275)',
          surface:        'oklch(0.125 0.009 275)',
          card:           'oklch(0.155 0.010 275)',
          'card-hover':   'oklch(0.185 0.011 275)',
          border:         'oklch(0.225 0.009 275)',
          'border-strong':'oklch(0.320 0.011 275)',
          ink:            'oklch(0.96 0.004 275)',
          'ink-2':        'oklch(0.76 0.007 275)',
          'ink-3':        'oklch(0.56 0.007 275)',
          accent:         'oklch(0.62 0.22 277)',
          'accent-bright':'oklch(0.75 0.18 277)',
          'accent-dim':   'oklch(0.62 0.22 277 / 0.12)',
          'accent-border':'oklch(0.62 0.22 277 / 0.40)',
        },
      },
      keyframes: {
        'spin-once': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'card-in': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'spin-once': 'spin-once 0.6s ease-out',
        'card-in':   'card-in 0.15s ease-out',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      const rotateValues = [0, 5, 10, 15, 20, 30, 45, 75];
      const rotateXUtilities = {};
      const rotateYUtilities = {};
      const rotateZUtilities = {};

      rotateValues.forEach((value) => {
        const transform = `translate3d(var(--tw-translate-x, 0), var(--tw-translate-y, 0), var(--tw-translate-z, 0)) rotateX(var(--tw-rotate-x, 0)) rotateY(var(--tw-rotate-y, 0)) rotateZ(var(--tw-rotate-z, 0)) skewX(var(--tw-skew-x, 0)) skewY(var(--tw-skew-y, 0)) scaleX(var(--tw-scale-x, 1)) scaleY(var(--tw-scale-y, 1))`;
        rotateXUtilities[`.rotate-x-${value}`] = { '--tw-rotate-x': `${value}deg`, transform };
        rotateYUtilities[`.rotate-y-${value}`] = { '--tw-rotate-y': `${value}deg`, transform };
        rotateZUtilities[`.rotate-z-${value}`] = { '--tw-rotate-z': `${value}deg`, transform };
        if (value !== 0) {
          rotateXUtilities[`.-rotate-x-${value}`] = { '--tw-rotate-x': `-${value}deg`, transform };
          rotateYUtilities[`.-rotate-y-${value}`] = { '--tw-rotate-y': `-${value}deg`, transform };
          rotateZUtilities[`.-rotate-z-${value}`] = { '--tw-rotate-z': `-${value}deg`, transform };
        }
      });

      addUtilities({
        ...rotateXUtilities,
        ...rotateYUtilities,
        ...rotateZUtilities,
        ".perspective-none": { perspective: "none" },
        ".perspective-[1000px]": { perspective: "1000px" },
        ".perspective-[2000px]": { perspective: "2000px" },
        ".transform-style-preserve-3d": { "transform-style": "preserve-3d" },
        ".transform-style-flat": { "transform-style": "flat" },
      });
    })
  ],
}
