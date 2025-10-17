/**
 * Voice Widget Main Entry Point
 * ES6 Module version for Vite bundler
 */

// Import ES6 modules
import { VoiceWidgetConfig } from './config.js';
import { VoiceWidgetCore } from './core.js';
import { VoiceWidgetUI } from './ui.js';

// Import ElevenLabs SDK statically - esto es lo que falta
import { Conversation } from '@elevenlabs/client';

// Initialize Voice Widget when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[VoiceWidget] Initializing with Vite bundler...');
  
  try {
    // Create voice widget instance with ElevenLabs SDK
    const voiceWidget = new VoiceWidgetCore(VoiceWidgetConfig, Conversation);
    const voiceWidgetUI = new VoiceWidgetUI(voiceWidget);
    
    // Initialize core with timeout protection
    console.log('[VoiceWidget] Starting initialization...');
    await Promise.race([
      voiceWidget.initialize(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Initialization timeout')), 15000)
      )
    ]);
    console.log('[VoiceWidget] Core initialization completed');
    
    // Initialize UI
    voiceWidgetUI.render();
    voiceWidgetUI.attachEventListeners();
    
    // Set up callbacks with error handling
    voiceWidget.onStatusChangeCallback = (status) => {
      try {
        voiceWidgetUI.updateStatus(status, voiceWidget.state.hasElevenLabsConfig);
      } catch (error) {
        console.error('[VoiceWidget] Status update error:', error);
      }
    };
    
    voiceWidget.onMessagesChangeCallback = (messages) => {
      try {
        voiceWidgetUI.updateMessages(messages);
      } catch (error) {
        console.error('[VoiceWidget] Messages update error:', error);
      }
    };
    
    voiceWidget.onMuteChangeCallback = (isMuted) => {
      try {
        voiceWidgetUI.updateMuteButton(isMuted);
      } catch (error) {
        console.error('[VoiceWidget] Mute update error:', error);
      }
    };
    
    voiceWidget.onTypingChangeCallback = (isTyping) => {
      try {
        voiceWidgetUI.showTypingIndicator(isTyping);
      } catch (error) {
        console.error('[VoiceWidget] Typing indicator error:', error);
      }
    };
    
    voiceWidget.onShowToastCallback = (title, message) => {
      try {
        voiceWidgetUI.showToast(title, message);
      } catch (error) {
        console.error('[VoiceWidget] Toast error:', error);
      }
    };
    
    voiceWidget.onToggleCallback = (isOpen) => {
      try {
        voiceWidgetUI.togglePanel(isOpen);
      } catch (error) {
        console.error('[VoiceWidget] Toggle error:', error);
      }
    };
    
    console.log('[VoiceWidget] Initialized successfully with Vite');
  } catch (error) {
    console.error('[VoiceWidget] Initialization error:', error);
    
    // Fallback: show error message to user
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; bottom: 20px; right: 20px; background: #ff4444; color: white; padding: 15px; border-radius: 8px; z-index: 10000; max-width: 300px;">
        <strong>Error del Voice Widget</strong><br>
        El asistente de voz no está disponible. Por favor, usa WhatsApp o el formulario de contacto.
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
});

// Export for potential external use
export { VoiceWidgetConfig, VoiceWidgetCore, VoiceWidgetUI };
