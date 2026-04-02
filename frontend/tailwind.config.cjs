module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Милая пастельная палитра
        pixel: {
          pink: '#FFB3D9',
          'pink-dark': '#FF6B9D',
          purple: '#C9A9E9',
          'purple-dark': '#9370DB',
          blue: '#A8D8FF',
          'blue-dark': '#5DADE2',
          yellow: '#FFF4A3',
          'yellow-dark': '#FFD700',
          green: '#B4E7CE',
          'green-dark': '#5FD3A7',
          orange: '#FFCBA4',
          'orange-dark': '#FFA07A',
          red: '#FFB3BA',
          'red-dark': '#FF6B6B',
          // Нейтральные
          dark: '#2d1b4e',
          'dark-purple': '#1a0a2e',
          cream: '#FFF8F0',
          white: '#FFFFFF',
        },
        // Градиенты для фонов
        bg: {
          primary: '#f8f4ff',
          secondary: '#fff8f0',
          tertiary: '#f0f8ff',
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
        retro: ['"VT323"', 'monospace'],
        cute: ['"Comfortaa"', 'cursive'],
        main: ['"Nunito"', 'sans-serif'],
      },
      boxShadow: {
        'pixel': '4px 4px 0 #2d1b4e',
        'pixel-sm': '2px 2px 0 #2d1b4e',
        'pixel-lg': '6px 6px 0 #2d1b4e',
        'pixel-hover': '2px 2px 0 #2d1b4e',
        'pixel-pink': '4px 4px 0 #FF6B9D',
        'pixel-purple': '4px 4px 0 #9370DB',
        'pixel-blue': '4px 4px 0 #5DADE2',
        'glow-pink': '0 0 20px rgba(255, 107, 157, 0.5)',
        'glow-purple': '0 0 20px rgba(147, 112, 219, 0.5)',
        'glow-blue': '0 0 20px rgba(93, 173, 226, 0.5)',
      },
      animation: {
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'heartbeat': 'heartbeat 1s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-in',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      borderWidth: {
        '3': '3px',
        '6': '6px',
      },
    },
  },
  plugins: [],
}
