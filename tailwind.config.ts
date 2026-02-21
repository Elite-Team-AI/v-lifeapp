import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          warm: "hsl(var(--accent-warm))",
          hot: "hsl(var(--accent-hot))",
          cool: "hsl(var(--accent-cool))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        vitalYellow: "#FFD700",
        charcoal: "#0a0a0f",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        heading: ["var(--font-outfit)", "Outfit", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 15px hsl(45 100% 51% / 0.4)" },
          "50%": { boxShadow: "0 0 30px hsl(45 100% 51% / 0.6)" },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 40px hsl(45 100% 51% / 0.3), 0 0 80px hsl(45 100% 51% / 0.2)"
          },
          "50%": {
            boxShadow: "0 0 60px hsl(45 100% 51% / 0.5), 0 0 100px hsl(45 100% 51% / 0.3)"
          },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(3deg)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "gradient-xy": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "25%": { backgroundPosition: "100% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "75%": { backgroundPosition: "0% 100%" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-left": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-right": {
          "0%": { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "scale-up": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "blob": {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -30px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "gradient-xy": "gradient-xy 15s ease infinite",
        "fade-up": "fade-up 0.5s ease-out forwards",
        "fade-down": "fade-down 0.5s ease-out forwards",
        "fade-left": "fade-left 0.5s ease-out forwards",
        "fade-right": "fade-right 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "scale-up": "scale-up 0.5s ease-out forwards",
        "blob": "blob 7s infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
      animationDelay: {
        '0': '0s',
        '100': '0.1s',
        '200': '0.2s',
        '300': '0.3s',
        '500': '0.5s',
        '700': '0.7s',
        '1000': '1s',
        '2000': '2s',
        '4000': '4s',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
