// tailwind.config.ts

import type { Config } from 'tailwindcss'
import animatePlugin from 'tailwindcss-animate'

export default {
  // Configure files to scan for classes
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  // Add the plugin
  plugins: [
    animatePlugin,
  ],
} satisfies Config