/**
 * Voice Widget Main Entry Point
 * Integra core, UI y eventos
 */

class VoiceWidget {
  constructor(customConfig = {}) {
    this.config = { ...VoiceWidgetConfig, ...customConfig };
    this.core = new VoiceWidgetCore(this.config);
    this.ui = new VoiceWidgetUI();
    
    this.setupCallbacks();
  }

  async init() {
    await this.core.checkElevenLabsConfig();
    this.ui.render();
    this.attachEventListeners();
    this.ui.updateStatus(this.core.state.voiceStatus, this.core.state.hasElevenLabsConfig);
  }

  setupCallbacks() {
    this.core.onMessagesChangeCallback = (messages) => {
      this.ui.updateMessages(messages, this.core.state.isTyping);
    };

    this.core.onStatusChangeCallback = (status) => {
      this.ui.updateStatus(status, this.core.state.hasElevenLabsConfig);
    };

    this.core.onConnectCallback = () => {
      this.ui.showTextInput(true);
    };

    this.core.onDisconnectCallback = () => {
      this.ui.showTextInput(false);
    };

    this.core.onStopCallback = () => {
      this.ui.updateMessages([], false);
      this.ui.showTextInput(false);
      this.ui.showToast('Llamada finalizada', 'La conversacion por voz se cerro correctamente.', 2600);
    };

    this.core.onMuteChangeCallback = (isMuted) => {
      this.ui.updateMuteButton(isMuted);
    };

    this.core.onTypingChangeCallback = (isTyping) => {
      this.ui.updateMessages(this.core.state.messages, isTyping);
    };

    this.core.onShowToastCallback = (title, message, duration) => {
      this.ui.showToast(title, message, duration);
    };
  }

  attachEventListeners() {
    // Event listeners para input de texto
    const textInput = document.getElementById('voice-widget-input-field');
    const sendBtn = document.getElementById('voice-widget-send-btn');

    if (textInput && sendBtn) {
      // Habilitar/deshabilitar boton de enviar
      textInput.addEventListener('input', (e) => {
        sendBtn.disabled = !e.target.value.trim();
      });

      // Enviar mensaje al presionar Enter
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && textInput.value.trim()) {
          e.preventDefault();
          this.core.sendTextMessage(textInput.value.trim());
          textInput.value = '';
          sendBtn.disabled = true;
        }
      });

      // Enviar mensaje al hacer click en el boton
      sendBtn.addEventListener('click', () => {
        if (textInput.value.trim()) {
          this.core.sendTextMessage(textInput.value.trim());
          textInput.value = '';
          sendBtn.disabled = true;
        }
      });
    }

    // Event listener para boton de llamada
    const callBtn = document.getElementById('voice-widget-call-btn');
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        if (this.core.state.voiceStatus === 'connected') {
          this.core.stopVoiceCall();
        } else {
          this.core.startVoiceCall();
        }
      });
    }

    // Event listener para boton de mute
    const micBtn = document.getElementById('voice-widget-mic-btn');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        this.core.toggleMute();
        // Actualizar apariencia visual del boton
        micBtn.classList.toggle('muted', this.core.refs.isMuted);
      });
    }

    // Event listeners principales
    this.ui.elements.fab.addEventListener('click', () => {
      this.core.state.isOpen = !this.core.state.isOpen;
      this.ui.togglePanel(this.core.state.isOpen);
    });

    this.ui.elements.closeBtn.addEventListener('click', () => {
      this.core.state.isOpen = false;
      this.ui.togglePanel(false);
      this.core.stopVoiceCall();
      this.core.state.messages = [];
      this.ui.updateMessages([], false);
    });
  }
}

// Auto-inicializacion cuando el DOM esta listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.voiceWidget = new VoiceWidget();
    window.voiceWidget.init();
  });
} else {
  window.voiceWidget = new VoiceWidget();
  window.voiceWidget.init();
}

