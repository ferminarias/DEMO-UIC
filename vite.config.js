import { defineConfig } from 'vite'

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
    sourcemap: false, // Deshabilitado para producción
    minify: 'terser',
    rollupOptions: {
      input: {
        main: './public/index.html'
      },
      output: {
        manualChunks: {
          'elevenlabs': ['@elevenlabs/client']
        }
      }
    },
    // Copiar archivos estáticos que no se pueden procesar
    copyPublicDir: true
  },
  
  // Configuración base para assets
  base: './',
  
  // Configuración de alias para imports más limpios
  resolve: {
    alias: {
      '@': '/public/assets/js'
    }
  },
  
  // Optimización para el SDK de ElevenLabs
  optimizeDeps: {
    include: ['@elevenlabs/client']
  },
  
  // Configuración para Vercel
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
})
