/**
 * Voice Widget Configuration
 * ES6 Module version
 */

export const VoiceWidgetConfig = {
  // API endpoints
  apiBaseUrl: '/api',
  
  // WhatsApp configuration
  whatsappNumber: '5255960232001',
  whatsappMessage: 'Hola! Me interesa conocer mas sobre los programas de UIC.',
  
  // Chat backend fallback - Backend propio de UIC
  chatApiUrl: '', // Usar endpoints locales del propio servidor
  chatEndpoint: '/api/chat/send',
  
  // ElevenLabs SDK URL - usar URL que funciona
  elevenLabsSDKUrl: 'https://cdn.jsdelivr.net/npm/@elevenlabs/client@0.5.0/dist/index.js',
  
  // UI Configuration
  showTranscriptionBar: false,
  autoCloseToastDelay: 3000,
};

// ES6 module export - no need for CommonJS fallback
