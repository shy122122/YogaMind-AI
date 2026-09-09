import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F8F6EE",
        linen: "#EFE8DB",
        forest: "#28352F",
        sage: "#4F8A70",
        mint: "#BEE8D2",
        lime: "#DDF58C",
        clay: "#E07A5F",
        night: "#18231F",
      },
      boxShadow: {
        soft: "0 18px 60px rgba(35, 47, 41, 0.12)",
        card: "0 10px 30px rgba(35, 47, 41, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "PingFang SC", "Microsoft YaHei", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
