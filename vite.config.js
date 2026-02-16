import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        contact: 'contact.html',
        message: 'message.html',
        ads: 'services/ads.html',
        ai: 'services/ai.html',
        analytics: 'services/analytics.html',
        data: 'services/data.html',
        development: 'services/development.html',
        dx: 'services/dx.html',
        line: 'services/line.html',
        marketing: 'services/marketing.html',
        sales_dx: 'services/sales-dx.html',
        support: 'services/support.html',
        web: 'services/web.html',
      },
    },
  },
})
