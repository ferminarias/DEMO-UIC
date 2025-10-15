/**
 * Voice Widget UI Manager
 * Manejo de la interfaz de usuario del widget
 */

class VoiceWidgetUI {
  constructor(containerId = 'voice-widget-root') {
    this.containerId = containerId;
    this.elements = {};
  }

  render() {
    const widgetHTML = `
      <div id="voice-widget-container" class="voice-widget-container">
        <button id="voice-widget-fab" class="voice-widget-fab" aria-label="Abrir asistente de voz">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
        </button>

        <div id="voice-widget-panel" class="voice-widget-panel voice-widget-hidden">
          <div class="voice-widget-content">
            <div class="voice-widget-header">
              <div>
                <h3>Asistente UIC</h3>
                <p>Elige como quieres comunicarte</p>
              </div>
              <div class="voice-widget-status">
                <div class="voice-widget-status-dot"></div>
                <span class="voice-widget-status-text">Listo para conversar</span>
              </div>
              <button id="voice-widget-close" class="voice-widget-close-btn" aria-label="Cerrar">×</button>
            </div>

            <div id="voice-widget-messages" class="voice-widget-messages"></div>

            <!-- Input de texto para conversación -->
            <div id="voice-widget-text-input" class="voice-widget-text-input voice-widget-hidden">
              <div class="voice-widget-input-container">
                <input
                  type="text"
                  id="voice-widget-input-field"
                  placeholder="Escribe tu mensaje..."
                  class="voice-widget-input"
                />
                <button id="voice-widget-send-btn" class="voice-widget-send-btn" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="voice-widget-controls">
              <div class="voice-widget-controls-card">
                <div class="voice-widget-controls-content">
                  <button id="voice-widget-mic-btn" class="voice-widget-control-btn voice-widget-mic-btn">
                    <svg id="voice-widget-mic-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" x2="12" y1="19" y2="22"></line>
                    </svg>
                  </button>
                  <p class="voice-widget-controls-title">Conversación por voz</p>
                  <p class="voice-widget-controls-subtitle">Habla directamente con el asistente IA</p>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" x2="12" y1="19" y2="22"></line>
                      </svg>
                    </button>
                    <button id="voice-widget-call-btn" class="voice-widget-call-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                      <span>Iniciar llamada</span>
                    </button>
                  </div>
                </div>
                <div id="voice-widget-no-config-msg" class="voice-widget-no-config voice-widget-hidden">
                  El asistente de voz estará disponible en breve. Mientras tanto puedes usar el chat de texto, WhatsApp o el formulario de contacto.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="voice-widget-toast" class="voice-widget-toast voice-widget-hidden">
          <div class="voice-widget-toast-content">
            <strong id="voice-widget-toast-title"></strong>
            <p id="voice-widget-toast-message"></p>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById(this.containerId) || document.body;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = widgetHTML;
    container.appendChild(wrapper.firstElementChild);

    this.cacheElements();
  }

  cacheElements() {
    this.elements = {
      fab: document.getElementById('voice-widget-fab'),
      panel: document.getElementById('voice-widget-panel'),
      closeBtn: document.getElementById('voice-widget-close'),
      messages: document.getElementById('voice-widget-messages'),
      textInput: document.getElementById('voice-widget-text-input'),
      textField: document.getElementById('voice-widget-text-field'),
      sendBtn: document.getElementById('voice-widget-send-btn'),
      callBtn: document.getElementById('voice-widget-call-btn'),
      muteBtn: document.getElementById('voice-widget-mute-btn'),
      statusDot: document.querySelector('.voice-widget-status-dot'),
      statusText: document.querySelector('.voice-widget-status-text'),
      noConfigMsg: document.getElementById('voice-widget-no-config-msg'),
      toast: document.getElementById('voice-widget-toast'),
      toastTitle: document.getElementById('voice-widget-toast-title'),
      toastMessage: document.getElementById('voice-widget-toast-message'),
    };
  }

  togglePanel(isOpen) {
    if (isOpen) {
      this.elements.panel.classList.remove('voice-widget-hidden');
    } else {
      this.elements.panel.classList.add('voice-widget-hidden');
    }
  }

  showTextInput(show) {
    if (show) {
      this.elements.textInput.classList.remove('voice-widget-hidden');
    } else {
      this.elements.textInput.classList.add('voice-widget-hidden');
    }
  }

  updateMessages(messages, isTyping = false) {
    this.elements.messages.innerHTML = messages.map(msg => `
      <div class="voice-widget-message voice-widget-message-${msg.type}">
        <div class="voice-widget-message-bubble">
          <p>${this.escapeHtml(msg.text)}</p>
          <span class="voice-widget-message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    `).join('');

    if (isTyping) {
      this.elements.messages.innerHTML += `
        <div class="voice-widget-message voice-widget-message-assistant">
          <div class="voice-widget-message-bubble">
            <div class="voice-widget-typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;
    }

    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  updateStatus(status, hasConfig) {
    this.elements.statusDot.className = 'voice-widget-status-dot';
    
    if (status === 'connected') {
      this.elements.statusDot.classList.add('voice-widget-status-connected');
    } else if (status === 'connecting' || status === 'getting-token') {
      this.elements.statusDot.classList.add('voice-widget-status-connecting');
    } else if (status === 'error') {
      this.elements.statusDot.classList.add('voice-widget-status-error');
    }

    const statusTexts = {
      'connected': 'Conversación activa',
      'connecting': 'Conectando con ElevenLabs...',
      'getting-token': 'Obteniendo token...',
      'asking-mic': 'Solicitando permisos...',
      'error': 'Error de conexión',
      'idle': hasConfig ? 'Listo para conversar' : 'Configuración pendiente'
    };
    this.elements.statusText.textContent = statusTexts[status] || 'Listo';

    // Update call button
    if (status === 'connected') {
      this.elements.callBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><span>Terminar</span>';
      this.elements.callBtn.classList.add('voice-widget-call-btn-active');
      this.elements.muteBtn.classList.remove('voice-widget-hidden');
    } else {
      this.elements.callBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><span>Iniciar llamada</span>';
      this.elements.callBtn.classList.remove('voice-widget-call-btn-active');
      this.elements.muteBtn.classList.add('voice-widget-hidden');
    }

    const isBusy = ['asking-mic', 'getting-token', 'connecting'].includes(status);
    this.elements.callBtn.disabled = (!hasConfig && status !== 'connected') || isBusy;

    if (!hasConfig && status === 'idle') {
      this.elements.noConfigMsg.classList.remove('voice-widget-hidden');
    } else {
      this.elements.noConfigMsg.classList.add('voice-widget-hidden');
    }
  }

  updateMuteButton(isMuted) {
    if (isMuted) {
      this.elements.muteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path></svg>';
    } else {
      this.elements.muteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>';
    }
  }

  showToast(title, message, duration = 3000) {
    this.elements.toastTitle.textContent = title;
    this.elements.toastMessage.textContent = message;
    this.elements.toast.classList.remove('voice-widget-hidden');

    setTimeout(() => {
      this.elements.toast.classList.add('voice-widget-hidden');
    }, duration);
  }

  clearTextInput() {
    this.elements.textField.value = '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
