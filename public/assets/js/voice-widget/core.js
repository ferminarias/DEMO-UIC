/**
 * Voice Widget Core Logic
 * Manejo de estado y lógica principal
 */

class VoiceWidgetCore {
  constructor(config) {
    this.config = config;
    this.state = {
      isOpen: false,
      messages: [],
      voiceStatus: 'idle',
      hasElevenLabsConfig: false,
      isMuted: false,
      isTyping: false,
    };

    this.refs = {
      session: null,
      mediaStream: null,
      sessionActive: false,
      transcriptionTimeout: null,
      simulationTimeouts: []
    };
  }

  async checkElevenLabsConfig() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/elevenlabs/check-config`);
      const { configured } = await response.json();
      this.state.hasElevenLabsConfig = configured;
      return configured;
    } catch (error) {
      console.log('[VoiceWidget] ElevenLabs config check failed:', error);
      this.state.hasElevenLabsConfig = false;
      return false;
    }
  }

  async startVoiceCall() {
    if (!this.state.hasElevenLabsConfig) {
      this.onConfigError();
      return;
    }

    try {
      this.clearSimulationTimers();
      this.state.messages = [];
      this.updateVoiceStatus('asking-mic');

      const stream = await this.requestMicrophone();
      if (!stream) return;

      this.updateVoiceStatus('getting-token');
      const tokenData = await this.fetchToken();
      
      if (!tokenData.configured) {
        throw new Error('ElevenLabs not configured');
      }

      this.updateVoiceStatus('connecting');

      if (tokenData.tokenGenerated && tokenData.token) {
        await this.startElevenLabsSession(tokenData);
      } else {
        this.simulateVoiceConversation();
      }
    } catch (error) {
      console.error('[VoiceWidget] Voice call error:', error);
      this.updateVoiceStatus('error');
      this.addMessage('Lo siento, no pude establecer la conexión de voz. Por favor, intenta usar WhatsApp o el formulario de contacto.', 'assistant');
    }
  }

  async requestMicrophone() {
    try {
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getTracks().forEach(track => track.stop());
        this.refs.mediaStream = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
        },
      });
      
      this.refs.mediaStream = stream;
      console.log('[VoiceWidget] Microphone access granted');
      return stream;
    } catch (error) {
      console.error('[VoiceWidget] Microphone access denied:', error);
      this.updateVoiceStatus('error');
      this.addMessage('Necesito acceso al micrófono para poder conversar contigo. Por favor, permite el acceso y vuelve a intentar.', 'assistant');
      return null;
    }
  }

  async fetchToken() {
    const response = await fetch(`${this.config.apiBaseUrl}/elevenlabs/token`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token request failed (${response.status}): ${errorText}`);
    }
    return await response.json();
  }

  async startElevenLabsSession(tokenData) {
    try {
      if (!window.ElevenLabs) {
        await this.loadElevenLabsSDK();
      }

      const { Conversation } = window.ElevenLabs;
      
      const conversation = await Conversation.startSession({
        agentId: tokenData.agentId,
        conversationToken: tokenData.token,
        connectionType: "webrtc",
        onConnect: () => this.onConnect(),
        onDisconnect: () => this.onDisconnect(),
        onMessage: (msg) => this.onMessage(msg),
        onError: (err) => this.onError(err),
        onStatusChange: (status) => console.log('[VoiceWidget] Status:', status),
        onModeChange: (mode) => console.log('[VoiceWidget] Mode:', mode),
      });

      this.refs.session = { conversation };
      console.log('[VoiceWidget] Session started successfully');
    } catch (error) {
      console.error('[VoiceWidget] ElevenLabs SDK error:', error);
      this.simulateVoiceConversation();
    }
  }

  async loadElevenLabsSDK() {
    return new Promise((resolve, reject) => {
      if (window.ElevenLabs) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.config.elevenLabsSDKUrl;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ElevenLabs SDK'));
      document.head.appendChild(script);
    });
  }

  onConnect() {
    console.log('[VoiceWidget] Connected');
    this.updateVoiceStatus('connected');
    this.refs.sessionActive = true;
    if (this.onConnectCallback) this.onConnectCallback();
  }

  onDisconnect() {
    console.log('[VoiceWidget] Disconnected');
    this.refs.sessionActive = false;
    this.updateVoiceStatus('idle');
    if (this.onDisconnectCallback) this.onDisconnectCallback();
  }

  onMessage(message) {
    if (!this.refs.sessionActive) return;

    let messageText = '';
    let messageType = 'assistant';

    if (message.message && message.message.trim()) {
      messageText = message.message;
      messageType = message.source === 'user' ? 'user' : 'assistant';
    } else if (message.text && message.text.trim()) {
      messageText = message.text;
      messageType = message.type === 'user' ? 'user' : 'assistant';
    } else if (message.content && message.content.trim()) {
      messageText = message.content;
      messageType = message.role === 'user' ? 'user' : 'assistant';
    } else if (typeof message === 'string' && message.trim()) {
      messageText = message;
    }

    if (messageText) {
      this.addMessage(messageText, messageType);
    }
  }

  onError(error) {
    console.error('[VoiceWidget] Error:', error);

    if (error?.message?.includes('WebSocket')) {
      this.addMessage('Reconectando... Por favor espera un momento.', 'assistant');
      return;
    }

    this.refs.sessionActive = false;
    this.safeEndSession();
    if (this.refs.mediaStream) {
      this.refs.mediaStream.getTracks().forEach(track => track.stop());
      this.refs.mediaStream = null;
    }
    this.updateVoiceStatus('error');
    this.addMessage('Error de conexión. La llamada se terminó. Puedes volver a intentar o usar WhatsApp.', 'assistant');
  }

  stopVoiceCall() {
    try {
      this.safeEndSession();
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getTracks().forEach(track => track.stop());
        this.refs.mediaStream = null;
      }
    } catch (error) {
      console.error('[VoiceWidget] Error stopping call:', error);
    }
    
    this.refs.sessionActive = false;
    this.clearSimulationTimers();
    this.updateVoiceStatus('idle');
    this.state.messages = [];
    this.state.isMuted = false;
    
    if (this.onStopCallback) this.onStopCallback();
  }

  safeEndSession() {
    try {
      if (this.refs.session?.conversation) {
        this.refs.session.conversation.endSession?.();
        this.refs.session.conversation.disconnect?.();
        this.refs.session = null;
      }
    } catch (e) {
      console.error('[VoiceWidget] Error ending session:', e);
    }
  }

  toggleMute() {
    if (!this.refs.session?.conversation) return;

    try {
      this.state.isMuted = !this.state.isMuted;
      this.refs.session.conversation.setMicMuted(this.state.isMuted);
      if (this.onMuteChangeCallback) this.onMuteChangeCallback(this.state.isMuted);
    } catch (error) {
      console.error('[VoiceWidget] Error toggling mute:', error);
    }
  }

  sendTextMessage(text) {
    if (!text.trim()) return;

    this.addMessage(text, 'user');

    if (this.refs.session?.conversation?.sendUserMessage) {
      try {
        this.refs.session.conversation.sendUserActivity?.();
        this.refs.session.conversation.sendUserMessage(text);
        return;
      } catch (error) {
        console.error('[VoiceWidget] Error sending via ElevenLabs:', error);
      }
    }

    this.sendMessageToBackend(text);
  }

  async sendMessageToBackend(message) {
    try {
      this.state.isTyping = true;
      if (this.onTypingChangeCallback) this.onTypingChangeCallback(true);

      const response = await fetch(`${this.config.chatApiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: `web-session-${Date.now()}`,
          userId: `web-user-${Date.now()}`,
          source: 'website-widget',
        }),
      });

      if (!response.ok) throw new Error(`Backend error: ${response.status}`);

      const data = await response.json();
      const responseText = data.response || data.message || 'Gracias por tu mensaje.';
      
      this.state.isTyping = false;
      if (this.onTypingChangeCallback) this.onTypingChangeCallback(false);
      this.addMessage(responseText, 'assistant');
    } catch (error) {
      console.error('[VoiceWidget] Backend error:', error);
      this.state.isTyping = false;
      if (this.onTypingChangeCallback) this.onTypingChangeCallback(false);
      this.addMessage('Error al enviar el mensaje. Por favor, intenta nuevamente.', 'assistant');
    }
  }

  simulateVoiceConversation() {
    this.clearSimulationTimers();
    this.updateVoiceStatus('connected');
    this.addMessage('¡Hola! Soy tu asistente de UIC. ¿En qué puedo ayudarte hoy?', 'assistant');
  }

  addMessage(text, type = 'assistant') {
    this.state.messages.push({
      text,
      timestamp: Date.now(),
      type
    });
    if (this.onMessagesChangeCallback) {
      this.onMessagesChangeCallback(this.state.messages);
    }
  }

  updateVoiceStatus(status) {
    this.state.voiceStatus = status;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }
  }

  clearSimulationTimers() {
    if (this.refs.transcriptionTimeout) {
      clearTimeout(this.refs.transcriptionTimeout);
      this.refs.transcriptionTimeout = null;
    }
    this.refs.simulationTimeouts.forEach(id => clearTimeout(id));
    this.refs.simulationTimeouts = [];
  }

  onConfigError() {
    if (this.onShowToastCallback) {
      this.onShowToastCallback(
        'Asistente de voz no disponible',
        'Usa el chat de texto, WhatsApp o el formulario de contacto mientras terminamos la configuración.'
      );
    }
  }
}
