/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DARK THEME (Mobile App Exact Colors)
        'dark-primary': '#0A1628',      // Deep navy - main background
        'dark-secondary': '#1A2942',    // Lighter navy - cards
        'dark-tertiary': '#2D3E5C',     // Card inner background

        // EMERALD GREEN (Brighter - Mobile App)
        'emerald-primary': '#10DC78',   // Bright emerald - main brand
        'emerald-dark': '#0EA968',      // Darker emerald
        'emerald-glow': 'rgba(16, 220, 120, 0.3)', // Glow effect

        // Emerald shades for gradients
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10DC78',  // Main brand (brighter)
          600: '#0EA968',  // Dark
        },
        green: {
          500: '#22C55E',
          600: '#0EA968',  // Match emerald-dark
          700: '#15803D',
        },

        // TEXT
        'text-primary': '#FFFFFF',      // White text
        'text-muted': '#94A3B8',        // Muted white/gray
        'text-dark': '#0F172A',         // Dark (for light backgrounds)

        // GRAY SCALE (For dark theme)
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },

        // STATUS
        orange: {
          500: '#F59E0B',
        },
        red: {
          500: '#EF4444',
        },
        teal: {
          600: '#0D9488',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'emerald': '0 10px 40px rgba(16, 220, 120, 0.3)',
        'emerald-lg': '0 20px 50px rgba(16, 220, 120, 0.2)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
