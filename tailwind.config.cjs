const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  important: true,
  theme: {
    extend: {
      aspectRatio: {
        card: '3 / 4',
      },
      colors: {
        retro: {
          brown: '#948c3c',
          green: '#9fbd8d',
          black: '#272526',
          red: '#9d5c71',
          'red-darker': '#7b4957',
        },
        type: {
          normal: '#A8A878',
          fighting: '#C03028',
          flying: '#A890F0',
          poison: '#A040A0',
          ground: '#E0C068',
          rock: '#B8A038',
          bug: '#A8B820',
          ghost: '#705898',
          steel: '#B8B8D0',
          fire: '#F08030',
          water: '#6890F0',
          grass: '#78C850',
          electric: '#F8D030',
          psychic: '#F85888',
          ice: '#98D8D8',
          dragon: '#7038F8',
          dark: '#705848',
          fairy: '#F0B6BC',
        },
        poke: {
          black: '#1A1110',
          blue: '#3185fc',
          brown: '#79443B',
          gray: '#536878',
          green: '#008000',
          pink: '#f61067',
          purple: '#5e239d',
          red: '#CE2029',
          white: '#B8B8D0',
          yellow: '#FFBF00',
        },
      },
      fontFamily: {
        sans: ['Mooli', ...defaultTheme.fontFamily.sans],
        pixel: ['VT323', 'monospace'],
      },
      boxShadow: {
        '3d': '1px 1px 2px 0px rgba(255, 255, 255, 0.5) inset, -1px -1px 2px 0px rgba(55, 55, 55, 0.3) inset',
        '3d-md':
          '2px 2px 4px 0px rgba(255, 255, 255, 0.5) inset, -2px -2px 4px 0px rgba(55, 55, 55, 0.3) inset',
        solid: '6px 8px 0px 0px rgba(0,0,0,0.2);',
        'solid-sm': '4px 4px 0px 0px rgba(0,0,0,0.2);',
        'solid-md': '6px 6px 0px 0px rgba(0,0,0,0.2);',
      },
      animation: {
        wiggle: 'wiggle 1s linear infinite',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': {
            transform: 'rotate(-2deg) translate3d(-4px, 0, 0)',
          },
          '40%, 60%': { transform: 'translate3d(2px, 0, 0)' },
        },
      },
      dropShadow: {
        solid: '1px 1px 0 rgba(0, 0, 0, 0.4)',
        'solid-sm': '2px 2px 0 rgba(0, 0, 0, 0.4)',
        'solid-md': '2px 4px 0 rgba(0, 0, 0, 0.4)',
        'solid-lg': '6px 8px 0 rgba(0, 0, 0, 0.4)',
        shine: '0px 0px 2px rgba(251, 236, 93, 0.8)',
        'shine-md': '0px 0px 4px rgba(251, 236, 93, 0.8)',
        'shine-lg': '0px 0px 8px rgba(251, 236, 93, 0.8)',
      },
    },
  },
  safelist: [
    'text-2xl',
    'text-3xl',
    {
      pattern: /.+-poke-.+/,
    },
    {
      pattern: /.+-type-.+/,
    },
  ],
  plugins: [],
}
