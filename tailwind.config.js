/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx, Broadway}",
  ],
  theme: {
    extend: {
      colors: {
        brandGreen: '#2D3E2F',
        brandCream: '#F0EFE9',
        brandSilk: '#FAF9F6',
      },
      fontFamily: {
        serif: ['Lora', 'serif'], // Or whichever serif font you are using
      },
    },
  },
  plugins: [],
}
