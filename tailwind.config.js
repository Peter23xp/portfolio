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
        // admin : texte d'interface en police système (nette en petite taille,
        // accents lisibles) ; titres en Anybody, la voix du site.
        space: ['ui-sans-serif', 'system-ui', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        oswald: ['"Anybody"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Palette admin — monde « peau à chromatophores » (DESIGN.md), version outil.
      // Zone de travail claire (manteau pigmenté), coque à l'encre, iridophore
      // réservé à l'action principale. Contraste texte ≥ 4.5:1 sur card/surface.
      colors: {
        adm: {
          bg:             'oklch(0.948 0.018 28)',   // manteau
          surface:        'oklch(0.915 0.026 30)',   // manteau-2 : colonnes, barres
          card:           'oklch(0.978 0.010 28)',   // face des cartes
          'card-hover':   'oklch(0.992 0.006 28)',
          border:         'oklch(0.85 0.025 32)',
          'border-strong':'oklch(0.74 0.035 33)',
          ink:            'oklch(0.235 0.022 40 / <alpha-value>)',   // crête
          'ink-2':        'oklch(0.36 0.040 35)',
          'ink-3':        'oklch(0.44 0.045 35)',
          accent:         'oklch(0.40 0.095 35 / <alpha-value>)',    // encre chromatique
          'accent-bright':'oklch(0.33 0.080 34)',
          'accent-dim':   'oklch(0.40 0.095 35 / 0.10)',
          'accent-border':'oklch(0.40 0.095 35 / 0.45)',
          shell:          'oklch(0.40 0.095 35 / <alpha-value>)',    // coque (barre du haut)
          'on-shell':     'oklch(0.955 0.016 28 / <alpha-value>)',
          'on-shell-2':   'oklch(0.86 0.040 32)',
          iris:           'oklch(0.72 0.115 205 / <alpha-value>)',   // seule couleur d'accent
          'iris-hi':      'oklch(0.80 0.100 200)',
          'iris-deep':    'oklch(0.48 0.095 215)',
          pigment:        'oklch(0.56 0.115 40)',
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
