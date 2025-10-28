import { fileURLToPath, URL } from 'node:url'
import { obfuscator } from 'rollup-obfuscator';

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    assetsDir: 'static',
    rollupOptions: {
      output: {
        hashCharacters: "hex",
        chunkFileNames: "static/js/chunk-[hash].js",
        manualChunks: undefined,
        assetFileNames: (chunkInfo) => {
          if (chunkInfo.name == undefined) {
            return "static/chunk-[hash][extname]";
          }
          var extType = chunkInfo.name.split('.').at(1)!;
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `static/${extType}/chunk-[hash][extname]`;
        },
        entryFileNames: "static/js/chunk-[hash].js",
      }
    },
  },
  plugins: [
    vue(),
    obfuscator()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // 反向代理
  server: {
    host: '0.0.0.0',
    port: 8090,
    // 是否自动在浏览器打开
    open: false,
    // 是否开启 https
    // https: false,
    // 设为 false 时，若端口已被占用则会尝试下一个可用端口,而不是直接退出
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        // rewrite: (path) => path.replace(/^\/api/, ''),
        rewrite: (path) => path,
      },
      '/d': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      },
      '/vnc.html': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      },
      '/websockify': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      },
      '/app': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      },
      '/vendor': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      },
      '/core': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        ws: true
      },
    },
  }
})
