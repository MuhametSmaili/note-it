/** @type {import('tailwindcss').Config} */

const backgroundColors = {
  primary: 'hsl(var(--color-bg-primary) / <alpha-value>)',
  light: 'hsl(var(--color-bg-light) / <alpha-value>)',
  acent: 'hsl(var(--color-bg-acent) / <alpha-value>)',
  highlight: 'hsl(var(--color-bg-highlight) / <alpha-value>)',
};

const borderColors = {
  primary: 'hsl(var(--color-border-primary) / <alpha-value>)',
};

const textColors = {
  primary: 'hsl(var(--color-text-primary) / <alpha-value>)',
  body: 'hsl(var(--color-text-body) / <alpha-value>)',
  light: 'hsl(var(--color-text-light) / <alpha-value>)',
  light2: 'hsl(var(--color-text-light2) / <alpha-value>)',
};

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,svg}'],
  theme: {
    colors: {
      inherit: 'inherit',
      transparent: 'transparent',
      current: 'currentColor',
      red: 'hsl(var(--color-red) / <alpha-value>)',
    },
    fontSize: {
      sm: '0.625rem', // ~ 12px
      md: '0.875rem', // ~ 14px
      xl: '1.25rem', // ~ 20px
    },
    borderRadius: {
      none: '0',
      sm: '.3125rem', // ~ 5px
      md: '1.25rem', // ~ 20px
    },
    extend: {
      backgroundImage: {},
      // Background concerns
      backgroundColor: backgroundColors,
      gradientColorStops: backgroundColors,

      // Border concerns
      borderColor: borderColors,
      stroke: borderColors,
      outlineColor: borderColors,
      ringColor: borderColors,

      textColor: textColors,
      fill: textColors,
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};
