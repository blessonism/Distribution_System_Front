import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 临时注释掉mock插件
// import { viteMockServe } from 'vite-plugin-mock'
// 注释掉开发工具导入
// import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      script: {
        // Disable type checking during build
        defineModel: true,
        propsDestructure: true,
      }
    }),
    // 临时禁用mock插件
    // viteMockServe({
    //   mockPath: 'src/mock',
    //   enable: true,
    //   watchFiles: true, // 监听文件变化
    // }),
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

    // 新增 host 配置，允许公网访问
    host: true,

    // 修改 open 配置，禁止自动打开浏览器
    open: false,
    // 强制退出时不提示
    strictPort: false,
    // 热更新配置
    watch: {
      usePolling: true,
    },
    // 本地开发代理到 API 网关
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 如网关实际路由不包含 /api 前缀，可启用下方重写：
        // rewrite: (p) => p.replace(/^\/api/, '')
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    // Ignore TypeScript errors during build
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    // Disable type checking for faster builds
    tsconfigRaw: {
      compilerOptions: {
        skipLibCheck: true,
        allowJs: true,
        noEmit: false,
        strict: false,
        noImplicitAny: false,
        noImplicitReturns: false,
        noImplicitThis: false,
        strictNullChecks: false,
      }
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
