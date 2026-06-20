import { join } from 'path';
import type { Config } from 'tailwindcss';
import { skeleton } from '@skeletonlabs/tw-plugin';

const config = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,js,svelte,ts}',
    join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f3',
          100: '#f9edd8',
          200: '#f2d8b0',
          300: '#e9be80',
          400: '#df9d4e',
          500: '#d68428',
          600: '#c86b1e',
          700: '#a6511b',
          800: '#85411e',
          900: '#6d371b',
        },
        accent: {
          50: '#f0f9f0',
          100: '#dbf2db',
          200: '#bae4ba',
          300: '#8bcd8b',
          400: '#59af59',
          500: '#3b913b',
          600: '#2d742d',
          700: '#265c26',
          800: '#214a21',
          900: '#1c3e1c',
        },
      },
    },
  },
  plugins: [
    skeleton({
      themes: {
        preset: [
          {
            name: 'wintry',
            enhancements: true,
          },
        ],
      },
    }),
  ],
} satisfies Config;

export default config;
