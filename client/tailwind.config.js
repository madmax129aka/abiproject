/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#FF6584',
        success: '#10B981',
        warning: '#F59E0B',
        dark: {
          bg: '#0F0F1A',
          surface: '#1A1A2E',
          'surface-light': '#16213E',
          border: '#2D2D4E'
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          'surface-light': '#F1F5F9',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif']
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}
