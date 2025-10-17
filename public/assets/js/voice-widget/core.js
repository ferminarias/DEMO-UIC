/**
 * Voice Widget Core Logic
 * ES6 Module version with Vite bundler
 */

export class VoiceWidgetCore {
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
      console.log('[VoiceWidget] Checking ElevenLabs config...');
      
      // Crear un timeout de 5 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.apiBaseUrl}/elevenlabs/check-config`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const configured = data.configured || false;
      
      this.state.hasElevenLabsConfig = configured;
      console.log('[VoiceWidget] ElevenLabs config check result:', configured);
      
      return configured;
    } catch (error) {
      console.warn('[VoiceWidget] ElevenLabs config check failed:', error.message || error);
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
      // Importar directamente como ULINEA - ahora funciona con Vite bundler
      const { Conversation } = await import("@elevenlabs/client");
      console.log('[VoiceWidget] ElevenLabs SDK loaded via Vite bundler');
      
      // Start WebRTC conversation - igual que ULINEA
      const conversation = await Conversation.startSession({
        agentId: tokenData.agentId,
        conversationToken: tokenData.token,
        connectionType: "webrtc",
        onConnect: () => {
          console.log('[VoiceWidget] ElevenLabs WebRTC connected');
          this.updateVoiceStatus('connected');
          this.refs.sessionActive = true;
        },
        onDisconnect: () => {
          console.log('[VoiceWidget] ElevenLabs session disconnected');
          this.refs.sessionActive = false;
          this.updateVoiceStatus('idle');
        },
        onMessage: (message) => {
          console.log('[VoiceWidget] Received message - Full object:', JSON.stringify(message, null, 2));
          console.log('[VoiceWidget] Message type:', typeof message);
          console.log('[VoiceWidget] Message keys:', Object.keys(message));

          if (!this.refs.sessionActive) {
            console.log('[VoiceWidget] Ignoring message because session is not active');
            return;
          }

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
            messageType = 'assistant';
          }

          if (messageText) {
            console.log('[VoiceWidget] Adding message to chat:', messageText, 'Type:', messageType);
            this.addMessage(messageText, messageType);
          } else {
            console.log('[VoiceWidget] No valid message text found in:', message);
          }
        },
        onError: (error) => {
          console.error('[VoiceWidget] ElevenLabs session error:', error);

          if (error?.message?.includes('WebSocket')) {
            console.log('[VoiceWidget] WebSocket error, allowing reconnection attempts');
            this.addMessage('Reconectando... Por favor espera un momento.', 'assistant');
            return;
          }

          try {
            this.refs.sessionActive = false;
            this.safeEndSession();
          } catch (e) {
            console.error('[VoiceWidget] Error while forcing session end after onError:', e);
          }
          if (this.refs.mediaStream) {
            this.refs.mediaStream.getTracks().forEach((track) => track.stop());
            this.refs.mediaStream = null;
          }
          this.updateVoiceStatus('error');
          this.addMessage('Error de conexión. La llamada se terminó. Puedes volver a intentar o usar WhatsApp.', 'assistant');
        },
        onStatusChange: (status) => {
          console.log('[VoiceWidget] Status changed:', status);
        },
        onModeChange: (mode) => {
          console.log('[VoiceWidget] Mode changed:', mode);
        },
      });

      // Crear estructura de sesión igual que ULINEA
      this.refs.session = {
        conversation,
        websocket: null,
        agentId: tokenData.agentId,
        token: tokenData.token,
        reconnectAttempts: 0,
        maxReconnectAttempts: 0,
        reconnectTimeout: null,
        isConnected: false,
        isInitialized: true
      };

      console.log('[VoiceWidget] Session started successfully');
    } catch (error) {
      console.error('[VoiceWidget] ElevenLabs SDK error:', error);
      console.log('[VoiceWidget] Falling back to simulation mode');
      
      // Mostrar mensaje informativo al usuario
      this.addMessage('El asistente de voz no está disponible en este momento. Puedes usar el chat de texto o contactarnos por WhatsApp.', 'assistant');
      
      // Activar modo simulación
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

      // URLs alternativas para el SDK - usando URLs que funcionan
      const sdkUrls = [
        this.config.elevenLabsSDKUrl,
        'https://unpkg.com/@elevenlabs/client@0.5.0/dist/elevenlabs.min.js',
        'https://unpkg.com/@elevenlabs/client@latest/dist/elevenlabs.min.js',
        'https://cdn.jsdelivr.net/npm/@elevenlabs/client@0.5.0/dist/elevenlabs.min.js'
      ];

      console.log('[VoiceWidget] Trying to load ElevenLabs SDK...');

      // Limpiar SDK anterior si existe
      const existingScript = document.querySelector('script[src*="@elevenlabs/client"]');
      if (existingScript) {
        console.log('[VoiceWidget] Removing existing SDK script');
        existingScript.remove();
      }

      const tryLoadSDK = (urlIndex = 0) => {
        if (urlIndex >= sdkUrls.length) {
          console.error('[VoiceWidget] All SDK URLs failed to load');
          console.log('[VoiceWidget] Will continue in simulation mode');
          // En lugar de rechazar, resolvemos para continuar en modo simulación
          resolve();
          return;
        }

        const url = sdkUrls[urlIndex];
        console.log('[VoiceWidget] Trying SDK URL:', url);

        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
          console.log('[VoiceWidget] ElevenLabs SDK script loaded from:', url);
          console.log('[VoiceWidget] window.ElevenLabs:', window.ElevenLabs);
          console.log('[VoiceWidget] window.ElevenLabs.Conversation:', window.ElevenLabs?.Conversation);
          
          // Esperar un poco para que el SDK se inicialice
          setTimeout(() => {
            // Verificar que el SDK esté disponible
            if (window.ElevenLabs && window.ElevenLabs.Conversation) {
              console.log('[VoiceWidget] ElevenLabs SDK loaded successfully');
              resolve();
            } else {
              console.error('[VoiceWidget] ElevenLabs SDK loaded but Conversation not available');
              console.error('[VoiceWidget] Available properties:', Object.keys(window.ElevenLabs || {}));
              console.error('[VoiceWidget] window object keys:', Object.keys(window).filter(key => key.includes('Eleven')));
              // Intentar con la siguiente URL
              tryLoadSDK(urlIndex + 1);
            }
          }, 100);
        };
        
        script.onerror = (error) => {
          console.error('[VoiceWidget] Failed to load ElevenLabs SDK from:', url, error);
          // Intentar con la siguiente URL
          tryLoadSDK(urlIndex + 1);
        };
        
        document.head.appendChild(script);
        console.log('[VoiceWidget] SDK script added to document head');
      };

      tryLoadSDK();
    });
  }

  // Las funciones onConnect, onDisconnect, onMessage, onError ahora están dentro de startElevenLabsSession

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
      // Handle new session format - igual que ULINEA
      if (this.refs.session && typeof this.refs.session === 'object' && 'conversation' in this.refs.session) {
        // Clear reconnect timeout
        if (this.refs.session.reconnectTimeout) {
          clearTimeout(this.refs.session.reconnectTimeout);
          this.refs.session.reconnectTimeout = null;
        }
        
        // Close WebSocket gracefully
        if (this.refs.session.websocket) {
          this.refs.session.websocket.close(1000, "Session ended by user");
          this.refs.session.websocket = null;
        }
        
        // End conversation session
        this.refs.session.conversation?.endSession && this.refs.session.conversation.endSession();
        this.refs.session.conversation?.disconnect && this.refs.session.conversation.disconnect();
      } 
      // Handle legacy format (direct conversation object)
      else {
        this.refs.session?.endSession && this.refs.session.endSession();
        this.refs.session?.disconnect && this.refs.session.disconnect();
      }
      
      this.refs.session = null;
    } catch (e) {
      console.error('[VoiceWidget] Error ending ElevenLabs session:', e);
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
    
    // Simular conexión exitosa pero con mensaje informativo
    this.addMessage('¡Hola! Soy tu asistente de UIC. Aunque el servicio de voz no está disponible en este momento, puedes escribirme tus preguntas y te ayudaré con información sobre nuestros programas.', 'assistant');
    
    // Crear una sesión simulada para que el input de texto funcione
    this.refs.session = {
      conversation: {
        sendUserMessage: (text) => {
          console.log('[VoiceWidget] Simulated text received:', text);
          // Simular respuesta del asistente
          setTimeout(() => {
            this.addMessage('Gracias por tu mensaje. Un asesor te contactará pronto para brindarte información detallada sobre nuestros programas.', 'assistant');
          }, 1000);
        },
        sendUserActivity: () => {
          console.log('[VoiceWidget] Simulated user activity');
        }
      },
      websocket: null,
      agentId: 'simulated',
      token: 'simulated',
      reconnectAttempts: 0,
      maxReconnectAttempts: 0,
      reconnectTimeout: null,
      isConnected: true,
      isInitialized: true
    };
    
    this.refs.sessionActive = true;
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
        // Notify activity before sending message - igual que ULINEA
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

  toggleWidget() {
    this.state.isOpen = !this.state.isOpen;
    console.log('[VoiceWidget] Widget toggled:', this.state.isOpen);
    
    // Notify UI of state change
    if (this.onToggleCallback) {
      this.onToggleCallback(this.state.isOpen);
    }
  }

  async initialize() {
    console.log('[VoiceWidget] Initializing...');
    
    try {
      // Check ElevenLabs configuration with timeout
      await Promise.race([
        this.checkElevenLabsConfig(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Config check timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.warn('[VoiceWidget] Config check failed or timed out:', error.message);
      this.state.hasElevenLabsConfig = false;
    }
    
    console.log('[VoiceWidget] Initialization complete');
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
    
    console.log('[VoiceWidget] Voice call stopped');
  }
}


