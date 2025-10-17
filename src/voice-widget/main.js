/**
 * Voice Widget Main Entry Point
 * Procesado por Vite (ESM)
 */

// Import ES6 modules
import { VoiceWidgetConfig } from './config.js';
import { VoiceWidgetCore } from './core.js';
import { VoiceWidgetUI } from './ui.js';

// Import estático del SDK para que Vite lo bundlee
import { Conversation } from '@elevenlabs/client';

// Initialize Voice Widget when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[VoiceWidget] Initializing with Vite bundler...');
  try {
    const voiceWidget = new VoiceWidgetCore(VoiceWidgetConfig, Conversation);
    const voiceWidgetUI = new VoiceWidgetUI(voiceWidget);

    console.log('[VoiceWidget] Starting initialization...');
    await Promise.race([
      voiceWidget.initialize(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Initialization timeout')), 15000))
    ]);
    console.log('[VoiceWidget] Core initialization completed');

    voiceWidgetUI.render();
    voiceWidgetUI.attachEventListeners();

    voiceWidget.onStatusChangeCallback = (status) => {
      try { voiceWidgetUI.updateStatus(status, voiceWidget.state.hasElevenLabsConfig); } catch (e) { console.error(e); }
    };
    voiceWidget.onMessagesChangeCallback = (messages) => {
      try { voiceWidgetUI.updateMessages(messages); } catch (e) { console.error(e); }
    };
    voiceWidget.onMuteChangeCallback = (isMuted) => {
      try { voiceWidgetUI.updateMuteButton(isMuted); } catch (e) { console.error(e); }
    };
    voiceWidget.onTypingChangeCallback = (isTyping) => {
      try { voiceWidgetUI.showTypingIndicator(isTyping); } catch (e) { console.error(e); }
    };
    voiceWidget.onShowToastCallback = (title, message) => {
      try { voiceWidgetUI.showToast(title, message); } catch (e) { console.error(e); }
    };
    voiceWidget.onToggleCallback = (isOpen) => {
      try { voiceWidgetUI.togglePanel(isOpen); } catch (e) { console.error(e); }
    };

    console.log('[VoiceWidget] Initialized successfully with Vite');
  } catch (error) {
    console.error('[VoiceWidget] Initialization error:', error);
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

export { VoiceWidgetConfig, VoiceWidgetCore, VoiceWidgetUI };


