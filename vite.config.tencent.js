import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 腾讯云部署专用配置
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // 优化代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'utils': ['date-fns', 'lucide-react']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  base: '/', // 腾讯云COS静态网站托管需要使用根路径
  preview: {
    port: 3000,
    host: true
  }
})