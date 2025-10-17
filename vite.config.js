import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  // Configuración para desarrollo
  server: {
    port: 3000,
    host: true,
    cors: true
  },
  
  // Configuración de build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          'elevenlabs': ['@elevenlabs/client']
        }
      }
    },
    copyPublicDir: true,
    // Aumentar límite de tamaño de chunk para ElevenLabs SDK
    chunkSizeWarningLimit: 1000
  },
  
  // Configuración base para assets
  base: './',
  
  // Configuración de alias para imports más limpios
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@voice-widget': resolve(__dirname, './src/voice-widget')
    }
  },
  
  // Optimización para el SDK de ElevenLabs
  optimizeDeps: {
    include: ['@elevenlabs/client'],
    // Forzar pre-bundling del SDK
    force: true
  },
  
  // Configuración para Vercel y variables de entorno
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    // Asegurar que global esté definido para el SDK
    'global': 'globalThis'
  }
})
