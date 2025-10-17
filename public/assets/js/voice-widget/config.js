/**
 * Voice Widget Configuration
 */

const VoiceWidgetConfig = {
  // API endpoints
  apiBaseUrl: '/api',
  
  // WhatsApp configuration
  whatsappNumber: '5255960232001',
  whatsappMessage: 'Hola! Me interesa conocer mas sobre los programas de UIC.',
  
  // Chat backend fallback - Backend propio de UIC
  chatApiUrl: '', // Usar endpoints locales del propio servidor
  chatEndpoint: '/api/chat/send',
  
  // ElevenLabs SDK URL
  elevenLabsSDKUrl: 'https://cdn.jsdelivr.net/npm/@elevenlabs/client@latest/dist/index.umd.js',
  
  // UI Configuration
  showTranscriptionBar: false,
  autoCloseToastDelay: 3000,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceWidgetConfig;
}
