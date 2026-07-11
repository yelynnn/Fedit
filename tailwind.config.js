/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard Variable", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.33", letterSpacing: "0" }],
        sm: ["14px", { lineHeight: "1.43", letterSpacing: "-0.005em" }],
        base: ["16px", { lineHeight: "1.50", letterSpacing: "-0.005em" }],
        lg: ["18px", { lineHeight: "1.44", letterSpacing: "-0.005em" }],
        xl: ["20px", { lineHeight: "1.40", letterSpacing: "-0.012em" }],
        "2xl": ["24px", { lineHeight: "1.33", letterSpacing: "-0.02em" }],
        "3xl": ["28px", { lineHeight: "1.36", letterSpacing: "-0.022em" }],
      },
    },
  },
  plugins: [],
};
