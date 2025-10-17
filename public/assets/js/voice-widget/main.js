/**
 * Voice Widget Main Entry Point
 * ES6 Module version for Vite bundler
 */

// Import ES6 modules
import { VoiceWidgetConfig } from './config.js';
import { VoiceWidgetCore } from './core.js';
import { VoiceWidgetUI } from './ui.js';

// Initialize Voice Widget when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[VoiceWidget] Initializing with Vite bundler...');
  
  try {
    // Create voice widget instance
    const voiceWidget = new VoiceWidgetCore(VoiceWidgetConfig);
    const voiceWidgetUI = new VoiceWidgetUI(voiceWidget);
    
    // Initialize UI
    voiceWidgetUI.render();
    voiceWidgetUI.attachEventListeners();
    
    // Set up callbacks
    voiceWidget.onStatusChangeCallback = (status) => {
      voiceWidgetUI.updateStatus(status);
    };
    
    voiceWidget.onMessagesChangeCallback = (messages) => {
      voiceWidgetUI.updateMessages(messages);
    };
    
    voiceWidget.onMuteChangeCallback = (isMuted) => {
      voiceWidgetUI.updateMuteButton(isMuted);
    };
    
    voiceWidget.onTypingChangeCallback = (isTyping) => {
      voiceWidgetUI.showTypingIndicator(isTyping);
    };
    
    voiceWidget.onShowToastCallback = (title, message) => {
      voiceWidgetUI.showToast(title, message);
    };
    
    console.log('[VoiceWidget] Initialized successfully with Vite');
  } catch (error) {
    console.error('[VoiceWidget] Initialization error:', error);
  }
});

// Export for potential external use
export { VoiceWidgetConfig, VoiceWidgetCore, VoiceWidgetUI };
