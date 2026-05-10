export default {
  content: [
    './app/app.vue',
    './app/pages/**/*.{vue,ts}',
    './app/components/**/*.{vue,ts}',
    './app/composables/**/*.ts',
    './app/layouts/**/*.{vue,ts}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#f8fbff',
          panel: '#ffffff',
          line: '#cfe3ff',
          lineSoft: '#e7f1ff',
          ink: '#172033',
          muted: '#64748b',
          blue: '#2f80ed',
          blueDark: '#1d5fd1',
          blueSoft: '#edf6ff',
          lime: '#65a30d',
          limeSoft: '#f0fadc',
          magenta: '#c026d3',
          magentaSoft: '#fdf4ff',
          orange: '#f97316',
          orangeSoft: '#fff3e8'
        }
      },
      borderRadius: {
        card: '1rem',
        section: '1.25rem',
        button: '9999px'
      },
      boxShadow: {
        soft: '0 16px 40px rgba(47, 128, 237, 0.10)',
        card: '0 10px 24px rgba(51, 65, 85, 0.08)',
        button: '0 10px 18px rgba(47, 128, 237, 0.22)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  }
}
