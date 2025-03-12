/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ["var(--font-inter)"],
        },
        screens: {
          'xxs': '320px',  // Pour iPhone SE (320px)
          'xs': '375px',   // Pour les petits téléphones comme iPhone X/11 Pro
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
  };