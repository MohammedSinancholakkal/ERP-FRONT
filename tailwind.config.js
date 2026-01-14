
/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          emerald: {
            500: '#059669',
            600: '#059669',
            DEFAULT: '#059669',
          },
        },
      },
    },
    plugins: [],
  };
  