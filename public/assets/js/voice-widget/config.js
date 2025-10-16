/**
 * Voice Widget Configuration
 */

const VoiceWidgetConfig = {
  // API endpoints
  apiBaseUrl: '/api',
  
  // WhatsApp configuration
  whatsappNumber: '5255960232001',
  whatsappMessage: 'Hola! Me interesa conocer mas sobre los programas de UIC.',
  
  // Chat backend fallback
  chatApiUrl: 'https://web-production-91918.up.railway.app',
  
  // ElevenLabs SDK URL
  elevenLabsSDKUrl: 'https://cdn.jsdelivr.net/npm/@elevenlabs/client@latest/dist/index.umd.js',
  
  // UI Configuration
  showTranscriptionBar: false,
  autoCloseToastDelay: 3000,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceWidgetConfig;
}
