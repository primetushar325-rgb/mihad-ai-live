/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'electric-blue': '#2E6BFF',
        'deep-navy': '#070B18',
        'navy-surface': '#0D1326',
        'navy-card': '#111832',
        cyan: '#33E6FF',
        'purple-glow': '#8B5CF6',
      },
      backgroundImage: {
        'mihad-gradient': 'linear-gradient(135deg, #2E6BFF 0%, #8B5CF6 55%, #33E6FF 100%)',
        'mihad-radial': 'radial-gradient(circle at 20% 20%, rgba(46,107,255,0.25), transparent 45%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.2), transparent 40%), radial-gradient(circle at 50% 100%, rgba(51,230,255,0.15), transparent 40%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(46,107,255,0.35)',
        'glow-cyan': '0 0 30px rgba(51,230,255,0.3)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
