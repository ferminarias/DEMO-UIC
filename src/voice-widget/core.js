/**
 * Voice Widget Core Logic (Vite)
 */

export class VoiceWidgetCore {
  constructor(config, ElevenLabsConversation = null) {
    this.config = config;
    this.ElevenLabsConversation = ElevenLabsConversation;
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

  async initialize() {
    console.log('[VoiceWidget Core] Initializing...');
    try {
      await this.checkElevenLabsConfig();
      console.log('[VoiceWidget Core] ElevenLabs configured:', this.state.hasElevenLabsConfig);
      return true;
    } catch (error) {
      console.error('[VoiceWidget Core] Initialization error:', error);
      this.state.hasElevenLabsConfig = false;
      return false;
    }
  }

  async checkElevenLabsConfig() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${this.config.apiBaseUrl}/elevenlabs/check-config`, { signal: controller.signal, headers: { 'Content-Type': 'application/json' } });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      const configured = data.configured || false;
      this.state.hasElevenLabsConfig = configured;
      return configured;
    } catch {
      this.state.hasElevenLabsConfig = false;
      return false;
    }
  }

  async startVoiceCall() {
    if (!this.state.hasElevenLabsConfig) { this.onConfigError(); return; }
    try {
      this.clearSimulationTimers();
      this.state.messages = [];
      this.updateVoiceStatus('asking-mic');
      const stream = await this.requestMicrophone();
      if (!stream) return;
      this.updateVoiceStatus('getting-token');
      const tokenData = await this.fetchToken();
      if (!tokenData.configured) throw new Error('ElevenLabs not configured');
      this.updateVoiceStatus('connecting');
      if (tokenData.tokenGenerated && tokenData.token) {
        await this.startElevenLabsSession(tokenData);
      } else {
        this.simulateVoiceConversation();
      }
    } catch {
      this.updateVoiceStatus('error');
      this.addMessage('Lo siento, no pude establecer la conexion de voz. Por favor, intenta usar WhatsApp o el formulario de contacto.', 'assistant');
    }
  }

  stopVoiceCall() {
    console.log('[VoiceWidget Core] Stopping voice call...');
    try {
      // Detener sesión activa
      this.refs.sessionActive = false;
      
      // Terminar sesión de ElevenLabs
      this.safeEndSession();
      
      // Detener y liberar el stream de audio
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getTracks().forEach(track => {
          track.stop();
          console.log('[VoiceWidget Core] Audio track stopped');
        });
        this.refs.mediaStream = null;
      }
      
      // Limpiar timers de simulación
      this.clearSimulationTimers();
      
      // Actualizar estado
      this.updateVoiceStatus('idle');
      this.addMessage('Llamada finalizada. ¡Gracias por usar el asistente de voz!', 'assistant');
      
      console.log('[VoiceWidget Core] Voice call stopped successfully');
    } catch (error) {
      console.error('[VoiceWidget Core] Error stopping voice call:', error);
      this.updateVoiceStatus('idle');
    }
  }

  async requestMicrophone() {
    try {
      if (this.refs.mediaStream) { this.refs.mediaStream.getTracks().forEach(track => track.stop()); this.refs.mediaStream = null; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 44100, sampleSize: 16 } });
      this.refs.mediaStream = stream;
      return stream;
    } catch {
      this.updateVoiceStatus('error');
      this.addMessage('Necesito acceso al microfono para poder conversar contigo. Por favor, permite el acceso y vuelve a intentar.', 'assistant');
      return null;
    }
  }

  async fetchToken() {
    const response = await fetch(`${this.config.apiBaseUrl}/elevenlabs/token`);
    if (!response.ok) throw new Error(`Token request failed (${response.status})`);
    return await response.json();
  }

  async startElevenLabsSession(tokenData) {
    const Conversation = this.ElevenLabsConversation;
    if (!Conversation) throw new Error('ElevenLabs Conversation class not available');
    const conversation = await Conversation.startSession({
      agentId: tokenData.agentId,
      conversationToken: tokenData.token,
      connectionType: 'webrtc',
      onConnect: () => { this.updateVoiceStatus('connected'); this.refs.sessionActive = true; },
      onDisconnect: () => { this.refs.sessionActive = false; this.updateVoiceStatus('idle'); },
      onMessage: (message) => {
        if (!this.refs.sessionActive) return;
        let messageText = '';
        let messageType = 'assistant';
        if (message.message?.trim()) { messageText = message.message; messageType = message.source === 'user' ? 'user' : 'assistant'; }
        else if (message.text?.trim()) { messageText = message.text; messageType = message.type === 'user' ? 'user' : 'assistant'; }
        else if (message.content?.trim()) { messageText = message.content; messageType = message.role === 'user' ? 'user' : 'assistant'; }
        else if (typeof message === 'string' && message.trim()) { messageText = message; messageType = 'assistant'; }
        if (messageText) this.addMessage(messageText, messageType);
      },
      onError: () => {
        this.refs.sessionActive = false;
        this.safeEndSession();
        if (this.refs.mediaStream) { this.refs.mediaStream.getTracks().forEach((track) => track.stop()); this.refs.mediaStream = null; }
        this.updateVoiceStatus('error');
        this.addMessage('Error de conexión. La llamada se terminó. Puedes volver a intentar o usar WhatsApp.', 'assistant');
      },
    });
    this.refs.session = { conversation, websocket: null, agentId: tokenData.agentId, token: tokenData.token, reconnectAttempts: 0, maxReconnectAttempts: 0, reconnectTimeout: null, isConnected: false, isInitialized: true };
  }

  safeEndSession() {
    try {
      if (this.refs.session && typeof this.refs.session === 'object' && 'conversation' in this.refs.session) {
        if (this.refs.session.reconnectTimeout) { clearTimeout(this.refs.session.reconnectTimeout); this.refs.session.reconnectTimeout = null; }
        if (this.refs.session.websocket) { this.refs.session.websocket.close(1000, 'Session ended by user'); this.refs.session.websocket = null; }
        this.refs.session.conversation?.endSession && this.refs.session.conversation.endSession();
        this.refs.session.conversation?.disconnect && this.refs.session.conversation.disconnect();
      } else {
        this.refs.session?.endSession && this.refs.session.endSession();
        this.refs.session?.disconnect && this.refs.session.disconnect();
      }
      this.refs.session = null;
    } catch {}
  }

  toggleMute() {
    if (!this.refs.session?.conversation) return;
    try {
      this.refs.isMuted = !this.refs.isMuted;
      this.state.isMuted = this.refs.isMuted;
      if (typeof this.refs.session.conversation.setMicMuted === 'function') { this.refs.session.conversation.setMicMuted(this.refs.isMuted); }
      if (this.onMuteChangeCallback) this.onMuteChangeCallback(this.refs.isMuted);
    } catch {}
  }

  simulateVoiceConversation() {
    this.clearSimulationTimers();
    this.updateVoiceStatus('connected');
    this.addMessage('¡Hola! Soy tu asistente de UIC. Aunque el servicio de voz no está disponible en este momento, puedes escribirme tus preguntas y te ayudaré con información sobre nuestros programas.', 'assistant');
    this.refs.session = { conversation: { sendUserMessage: (text) => { setTimeout(() => { this.addMessage('Gracias por tu mensaje. Un asesor te contactará pronto para brindarte información detallada sobre nuestros programas.', 'assistant'); }, 1000); }, sendUserActivity: () => {} }, websocket: null, agentId: 'simulated', token: 'simulated', reconnectAttempts: 0, maxReconnectAttempts: 0, reconnectTimeout: null, isConnected: true, isInitialized: true };
    this.refs.sessionActive = true;
  }

  async sendTextMessage(text) {
    if (!text?.trim()) return;
    const messageText = text.trim();
    this.addMessage(messageText, 'user');
    if (this.refs.session?.conversation && typeof this.refs.session.conversation.sendUserMessage === 'function') {
      try { this.refs.session.conversation.sendUserActivity?.(); this.refs.session.conversation.sendUserMessage(messageText); return; } catch {}
    }
    if (this.refs.session && this.sendTextToElevenLabs(this.refs.session, messageText)) return;
    try {
      this.state.isTyping = true; if (this.onTypingChangeCallback) this.onTypingChangeCallback(true);
      let baseUrl = '';
      if (typeof this.config.chatApiUrl === 'string' && this.config.chatApiUrl.trim()) baseUrl = this.config.chatApiUrl.trim().replace(/\/$/, '');
      const path = this.config.chatEndpoint || '/api/chat/send';
      const endpoint = baseUrl ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : path;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ message: messageText, sessionId: `web-session-${Date.now()}`, userId: `web-user-${Date.now()}`, source: 'website-widget' }), signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) { const data = await response.json(); const reply = data.response || data.message || 'Gracias por tu mensaje. Te responderemos pronto.'; this.addMessage(reply, 'assistant'); }
      else { throw new Error(`Backend response not ok (${response.status})`); }
    } catch (error) {
      if (error.name === 'AbortError') this.addMessage('La conexión tardó demasiado tiempo. Por favor, intenta nuevamente.', 'assistant');
      else if (String(error.message).includes('Failed to fetch')) this.addMessage('No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.', 'assistant');
      else this.addMessage('Gracias por tu mensaje. En breve un asesor te responderá.', 'assistant');
    } finally {
      this.state.isTyping = false; if (this.onTypingChangeCallback) this.onTypingChangeCallback(false);
    }
  }

  updateVoiceStatus(status) {
    this.state.voiceStatus = status;
    if (this.onStatusChangeCallback) this.onStatusChangeCallback(status);
    const textInput = document.getElementById('voice-widget-text-input');
    if (textInput) { if (status === 'connected') textInput.classList.remove('voice-widget-hidden'); else textInput.classList.add('voice-widget-hidden'); }
  }

  clearSimulationTimers() {
    if (this.refs.transcriptionTimeout) { clearTimeout(this.refs.transcriptionTimeout); this.refs.transcriptionTimeout = null; }
    this.refs.simulationTimeouts.forEach(id => clearTimeout(id));
    this.refs.simulationTimeouts = [];
  }

  onConfigError() {
    if (this.onShowToastCallback) this.onShowToastCallback('Asistente de voz no disponible', 'Usa el chat de texto, WhatsApp o el formulario de contacto mientras terminamos la configuracion.');
  }

  sendTextToElevenLabs(session, text) {
    if (session.conversation && typeof session.conversation.sendUserMessage === 'function') {
      try { session.conversation.sendUserActivity?.(); session.conversation.sendUserMessage(text.trim()); return true; } catch {}
    }
    if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
      try { session.websocket.send(JSON.stringify({ type: 'user_message', text: text.trim() })); return true; } catch {}
    }
    return false;
  }

  addMessage(text, type = 'assistant') {
    if (!text) return;
    const message = { text, type, timestamp: Date.now() };
    this.state.messages = [...this.state.messages, message].slice(-100);
    if (this.onMessagesChangeCallback) this.onMessagesChangeCallback(this.state.messages);
  }

  toggleWidget() {
    this.state.isOpen = !this.state.isOpen;
    if (this.onToggleCallback) this.onToggleCallback(this.state.isOpen);
  }
}


