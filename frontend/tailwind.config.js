/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pearl & Ivory Base Palette
        pearl: {
          50: '#FFFFFF',
          100: '#FAF9F6', // Soft Ivory
          200: '#F8FAFC', // Warm White
          300: '#F1F5F9', // Platinum
          400: '#E2E8F0', // Border Grey
          500: '#CBD5E1',
        },
        // Deep Navy Typography & Contrast
        navy: {
          950: '#060B18',
          900: '#0B132B', // Headline Navy
          800: '#0F172A', // Slate Deep
          700: '#1E293B',
          600: '#334155',
          500: '#475569',
          400: '#64748B',
          300: '#94A3B8',
        },
        // RYDO Signature Electric Blue
        electric: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9', // Core Electric Blue
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
        },
        // Subtle Champagne Gold for Luxury Tiers
        champagne: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F59E0B',
          500: '#D4AF37', // Metallic Gold
          600: '#B45309',
        },
        cyan: {
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 10px 30px -5px rgba(11, 19, 43, 0.05), 0 20px 25px -5px rgba(11, 19, 43, 0.03)',
        'luxury-lg': '0 20px 40px -10px rgba(11, 19, 43, 0.08), 0 10px 20px -5px rgba(11, 19, 43, 0.04)',
        'glass': '0 8px 32px 0 rgba(14, 165, 233, 0.08)',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        radar: 'radar 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite',
        float: 'float 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
