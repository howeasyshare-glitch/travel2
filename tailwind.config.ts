/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./page.tsx", // 額外補上一行確保掃描到首頁
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
