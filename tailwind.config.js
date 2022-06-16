/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      white: '#FFFFFF',
      gray: {
        light: '#EFEFEF',
        true: '#D2D2D2',
      },
      black: '#000000',
      blue: {
        light: '#8ECAE6',
        green: '#219EBC',
        prussian: '#023047',
      },
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
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
};
