/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
          black: '#03071e',
          blue: '#6890F0',
          brown: '#705848',
          gray: '#4a4e69',
          green: '#78C850',
          pink: '#F85888',
          purple: '#A040A0',
          red: '#C03028',
          white: '#B8B8D0',
          yellow: '#F8D030',
        },
      },
      fontFamily: {
        pixel: ['VT323', 'monospace'],
      },
      boxShadow: {
        '3d': '1px 1px 2px 0px rgba(255, 255, 255, 0.5) inset, -1px -1px 2px 0px rgba(55, 55, 55, 0.3) inset',
        solid: '6px 8px 0px 0px rgba(0,0,0,0.2);',
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
