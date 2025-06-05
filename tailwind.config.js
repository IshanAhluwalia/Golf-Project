/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a237e',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1565C0',
          foreground: '#ffffff',
        },
        background: '#f5f7fa',
      },
      borderRadius: {
        lg: '16px',
      },
      boxShadow: {
        card: '0 4px 20px rgba(0,0,0,0.1)',
        button: '0 2px 8px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
} 