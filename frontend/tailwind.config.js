/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0B1220",
          card: "#111827",
          inner: "#172033",
          input: "#0F172A",
          border: "#263449",
          primary: "#4F8CFF",
          hover: "#3B78E7",
          teal: "#2DD4BF",
          success: "#22C55E",
          error: "#EF4444",
          textPrimary: "#F8FAFC",
          textSecondary: "#A7B3C6",
          muted: "#718096",
          placeholder: "#64748B",
        },
      },
    },
  },
  plugins: [],
};
