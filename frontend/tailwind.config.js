/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        spotify: {
          green: "#1DB954",
          "green-hover": "#1ed760",
          black: "#121212",
          charcoal: "#181818",
          sidebar: "#000000",
          "text-muted": "#b3b3b3",
          "text-dim": "#6a6a6a",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#1DB954",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        circular: ['"Circular"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        "spotify-card": "0 8px 16px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
