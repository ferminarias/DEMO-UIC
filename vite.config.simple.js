import { defineConfig } from 'vite'

export default defineConfig({
  // Configuración simplificada para Vercel
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: false, // Deshabilitar minificación temporalmente
    rollupOptions: {
      input: './public/index.html'
    }
  },
  
  base: './',
  
  // Optimización para el SDK de ElevenLabs
  optimizeDeps: {
    include: ['@elevenlabs/client']
  }
})
