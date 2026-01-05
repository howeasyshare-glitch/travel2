import type { Config } from "tailwindcss";

const config: Config = {
  // 使用更寬鬆的匹配，確保掃描到所有角落
  content: [
    "./app/api/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // 預防萬一你的結構在 src 裡
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
