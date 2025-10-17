/**
 * Voice Widget Core Logic
 * Manejo de estado y logica principal
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
      simulationTimeouts: [],
      isMuted: false
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
      this.addMessage('Lo siento, no pude establecer la conexion de voz. Por favor, intenta usar WhatsApp o el formulario de contacto.', 'assistant');
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
      this.addMessage('Necesito acceso al microfono para poder conversar contigo. Por favor, permite el acceso y vuelve a intentar.', 'assistant');
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
      if (window.ElevenLabs && window.ElevenLabs.Conversation) {
        console.log('[VoiceWidget] ElevenLabs SDK already loaded');
        resolve();
        return;
      }

      // Limpiar SDK anterior si existe
      const existingScript = document.querySelector('script[src*="@elevenlabs/client"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.src = this.config.elevenLabsSDKUrl;
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('[VoiceWidget] ElevenLabs SDK loaded successfully');
        // Verificar que el SDK esté disponible
        if (window.ElevenLabs && window.ElevenLabs.Conversation) {
          resolve();
        } else {
          reject(new Error('ElevenLabs SDK loaded but Conversation not available'));
        }
      };
      
      script.onerror = () => {
        console.error('[VoiceWidget] Failed to load ElevenLabs SDK');
        reject(new Error('Failed to load ElevenLabs SDK'));
      };
      
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
    this.addMessage('Error de conexion. La llamada se termino. Puedes volver a intentar o usar WhatsApp.', 'assistant');
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
    if (!this.refs.session?.conversation) {
      console.warn('[VoiceWidget] toggleMute called without active conversation');
      return;
    }

    try {
      this.refs.isMuted = !this.refs.isMuted;
      this.state.isMuted = this.refs.isMuted;

      if (typeof this.refs.session.conversation.setMicMuted === 'function') {
        this.refs.session.conversation.setMicMuted(this.refs.isMuted);
      }

      if (this.onMuteChangeCallback) {
        this.onMuteChangeCallback(this.refs.isMuted);
      }
    } catch (error) {
      console.error('[VoiceWidget] Error toggling mute:', error);
    }
  }

  simulateVoiceConversation() {
    this.clearSimulationTimers();
    this.updateVoiceStatus('connected');
    this.addMessage('Hola! Soy tu asistente de UIC. En que puedo ayudarte hoy?', 'assistant');
  }

  async sendTextMessage(text) {
    if (!text || !text.trim()) return;

    const messageText = text.trim();
    console.log('[VoiceWidget] Sending text message:', messageText);

    // Add user message to chat
    this.addMessage(messageText, 'user');

    // Primary method: Send text to ElevenLabs conversation
    if (this.refs.session?.conversation && typeof this.refs.session.conversation.sendUserMessage === 'function') {
      try {
        // Notify activity while typing
        if (this.refs.session.conversation.sendUserActivity) {
          this.refs.session.conversation.sendUserActivity();
        }
        this.refs.session.conversation.sendUserMessage(messageText);
        console.log('[VoiceWidget] Text sent via conversation.sendUserMessage');
        return;
      } catch (error) {
        console.error('[VoiceWidget] Error with conversation.sendUserMessage:', error);
      }
    }

    // Fallback helper for ElevenLabs
    if (this.refs.session) {
      const sentViaElevenLabs = this.sendTextToElevenLabs(this.refs.session, messageText);
      if (sentViaElevenLabs) {
        console.log('[VoiceWidget] Text sent successfully to ElevenLabs via fallback');
        return;
      }
    }

    // Last resort: Backend fallback
    console.log('[VoiceWidget] All ElevenLabs methods failed, using backend fallback');
    try {
      this.state.isTyping = true;
      if (this.onTypingChangeCallback) this.onTypingChangeCallback(true);

      let baseUrl = '';
      if (typeof this.config.chatApiUrl === 'string' && this.config.chatApiUrl.trim()) {
        baseUrl = this.config.chatApiUrl.trim().replace(/\/$/, '');
      }
      const path = this.config.chatEndpoint || '/api/chat/send';
      const endpoint = baseUrl
        ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
        : path;

      console.log('[VoiceWidget] Sending to backend:', endpoint);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: `web-session-${Date.now()}`,
          userId: `web-user-${Date.now()}`,
          source: 'website-widget'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const reply = data.response || data.message || 'Gracias por tu mensaje. Te responderemos pronto.';
        this.addMessage(reply, 'assistant');
      } else {
        const errorText = await response.text();
        throw new Error(`Backend response not ok (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('[VoiceWidget] Backend error:', error);
      
      // Manejar diferentes tipos de errores
      if (error.name === 'AbortError') {
        this.addMessage('La conexión tardó demasiado tiempo. Por favor, intenta nuevamente.', 'assistant');
      } else if (error.message.includes('Failed to fetch')) {
        this.addMessage('No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.', 'assistant');
      } else {
        this.addMessage('Gracias por tu mensaje. En breve un asesor te responderá.', 'assistant');
      }
    } finally {
      this.state.isTyping = false;
      if (this.onTypingChangeCallback) this.onTypingChangeCallback(false);
    }
  }

  updateVoiceStatus(status) {
    this.state.voiceStatus = status;
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(status);
    }

    // Mostrar/ocultar input de texto basado en el estado
    const textInput = document.getElementById('voice-widget-text-input');
    if (textInput) {
      if (status === 'connected') {
        textInput.classList.remove('voice-widget-hidden');
      } else {
        textInput.classList.add('voice-widget-hidden');
      }
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
        'Usa el chat de texto, WhatsApp o el formulario de contacto mientras terminamos la configuracion.'
      );
    }
  }

  sendTextToElevenLabs(session, text) {
    console.log('[VoiceWidget] Attempting to send text:', text);

    // Primary path for WebRTC ConvAI sessions
    if (session.conversation && typeof session.conversation.sendUserMessage === 'function') {
      try {
        session.conversation.sendUserActivity?.();
        session.conversation.sendUserMessage(text.trim());
        console.log('[VoiceWidget] Text sent via conversation.sendUserMessage');
        return true;
      } catch (error) {
        console.error('[VoiceWidget] Error with conversation.sendUserMessage:', error);
      }
    }

    // Optional websocket path only if caller opened a WS session explicitly
    if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
      try {
        const payload = { type: 'user_message', text: text.trim() };
        session.websocket.send(JSON.stringify(payload));
        console.log('[VoiceWidget] Text sent via session WebSocket');
        return true;
      } catch (error) {
        console.error('[VoiceWidget] Error sending via session WebSocket:', error);
      }
    }

    console.warn('[VoiceWidget] No available method to send text in current session mode');
    return false;
  }

  addMessage(text, type = 'assistant') {
    if (!text) return;

    const message = {
      text,
      type,
      timestamp: Date.now(),
    };

    this.state.messages = [...this.state.messages, message].slice(-100);
    if (this.onMessagesChangeCallback) {
      this.onMessagesChangeCallback(this.state.messages);
    }
  }
}


