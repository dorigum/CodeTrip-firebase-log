import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5180,
    proxy: {
      // 공공데이터 여행 API 프록시
      '/B551011': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
