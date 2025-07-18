import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 注释掉开发工具导入
// import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 注释掉开发工具启用
    // vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    // 开启CORS支持
    cors: true,
    // 添加更多调试日志
    hmr: {
      overlay: true,
    },
    // 确保单页应用能处理所有路由
    middlewareMode: false,
    // 配置自动打开浏览器
    open: true,
    // 强制退出时不提示
    strictPort: false,
    // 热更新配置
    watch: {
      usePolling: true,
    }
  },
  build: {
    // 生成带有缓存控制的sourcemaps
    sourcemap: true,
    // 输出路径
    outDir: 'dist',
    // 确保单页应用路由支持
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        }
      }
    }
  }
})
