import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Prime Global Logistics brand — cerulean blue (globe + wordmark).
        brand: {
          50: '#edf7fc',
          100: '#d3ecf8',
          200: '#a9d9f0',
          300: '#72c1e6',
          400: '#38a6d8',
          500: '#1b8fce',
          600: '#1678af',
          700: '#17638f',
          800: '#1a5474',
          900: '#133f57',
        },
        // Brand green (arrow + "Global Logistics").
        accent: {
          50: '#f1f9ec',
          100: '#ddf0d0',
          200: '#bfe3a9',
          300: '#97d178',
          400: '#74c257',
          500: '#5cb948',
          600: '#4c9e3a',
          700: '#3c7d30',
          800: '#336429',
          900: '#2b5224',
        },
      },
    },
  },
  plugins: [],
};

export default config;
