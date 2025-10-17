(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const VoiceWidgetConfig = {
  // API endpoints
  apiBaseUrl: "/api",
  // WhatsApp configuration
  whatsappNumber: "5255960232001",
  whatsappMessage: "Hola! Me interesa conocer mas sobre los programas de UIC.",
  // Chat backend fallback - Backend propio de UIC
  chatApiUrl: "",
  // Usar endpoints locales del propio servidor
  chatEndpoint: "/api/chat/send",
  // ElevenLabs SDK URL - usar URL que funciona
  elevenLabsSDKUrl: "https://cdn.jsdelivr.net/npm/@elevenlabs/client@0.5.0/dist/index.js",
  // UI Configuration
  showTranscriptionBar: false,
  autoCloseToastDelay: 3e3
};
const scriptRel = "modulepreload";
const assetsURL = function(dep, importerUrl) {
  return new URL(dep, importerUrl).href;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    const links = document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep, importerUrl);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        const isBaseRelative = !!importerUrl;
        if (isBaseRelative) {
          for (let i = links.length - 1; i >= 0; i--) {
            const link2 = links[i];
            if (link2.href === dep && (!isCss || link2.rel === "stylesheet")) {
              return;
            }
          }
        } else if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
class VoiceWidgetCore {
  constructor(config) {
    this.config = config;
    this.state = {
      isOpen: false,
      messages: [],
      voiceStatus: "idle",
      hasElevenLabsConfig: false,
      isMuted: false,
      isTyping: false
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
      console.log("[VoiceWidget] ElevenLabs config check failed:", error);
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
      this.updateVoiceStatus("asking-mic");
      const stream = await this.requestMicrophone();
      if (!stream) return;
      this.updateVoiceStatus("getting-token");
      const tokenData = await this.fetchToken();
      if (!tokenData.configured) {
        throw new Error("ElevenLabs not configured");
      }
      this.updateVoiceStatus("connecting");
      if (tokenData.tokenGenerated && tokenData.token) {
        await this.startElevenLabsSession(tokenData);
      } else {
        this.simulateVoiceConversation();
      }
    } catch (error) {
      console.error("[VoiceWidget] Voice call error:", error);
      this.updateVoiceStatus("error");
      this.addMessage("Lo siento, no pude establecer la conexion de voz. Por favor, intenta usar WhatsApp o el formulario de contacto.", "assistant");
    }
  }
  async requestMicrophone() {
    try {
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getTracks().forEach((track) => track.stop());
        this.refs.mediaStream = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16
        }
      });
      this.refs.mediaStream = stream;
      console.log("[VoiceWidget] Microphone access granted");
      return stream;
    } catch (error) {
      console.error("[VoiceWidget] Microphone access denied:", error);
      this.updateVoiceStatus("error");
      this.addMessage("Necesito acceso al microfono para poder conversar contigo. Por favor, permite el acceso y vuelve a intentar.", "assistant");
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
      const { Conversation } = await __vitePreload(async () => {
        const { Conversation: Conversation2 } = await import("./lib.modern-CcEpmQ6K.js");
        return { Conversation: Conversation2 };
      }, true ? [] : void 0, import.meta.url);
      console.log("[VoiceWidget] ElevenLabs SDK loaded via Vite bundler");
      const conversation = await Conversation.startSession({
        agentId: tokenData.agentId,
        conversationToken: tokenData.token,
        connectionType: "webrtc",
        onConnect: () => {
          console.log("[VoiceWidget] ElevenLabs WebRTC connected");
          this.updateVoiceStatus("connected");
          this.refs.sessionActive = true;
        },
        onDisconnect: () => {
          console.log("[VoiceWidget] ElevenLabs session disconnected");
          this.refs.sessionActive = false;
          this.updateVoiceStatus("idle");
        },
        onMessage: (message) => {
          console.log("[VoiceWidget] Received message - Full object:", JSON.stringify(message, null, 2));
          console.log("[VoiceWidget] Message type:", typeof message);
          console.log("[VoiceWidget] Message keys:", Object.keys(message));
          if (!this.refs.sessionActive) {
            console.log("[VoiceWidget] Ignoring message because session is not active");
            return;
          }
          let messageText = "";
          let messageType = "assistant";
          if (message.message && message.message.trim()) {
            messageText = message.message;
            messageType = message.source === "user" ? "user" : "assistant";
          } else if (message.text && message.text.trim()) {
            messageText = message.text;
            messageType = message.type === "user" ? "user" : "assistant";
          } else if (message.content && message.content.trim()) {
            messageText = message.content;
            messageType = message.role === "user" ? "user" : "assistant";
          } else if (typeof message === "string" && message.trim()) {
            messageText = message;
            messageType = "assistant";
          }
          if (messageText) {
            console.log("[VoiceWidget] Adding message to chat:", messageText, "Type:", messageType);
            this.addMessage(messageText, messageType);
          } else {
            console.log("[VoiceWidget] No valid message text found in:", message);
          }
        },
        onError: (error) => {
          var _a;
          console.error("[VoiceWidget] ElevenLabs session error:", error);
          if ((_a = error == null ? void 0 : error.message) == null ? void 0 : _a.includes("WebSocket")) {
            console.log("[VoiceWidget] WebSocket error, allowing reconnection attempts");
            this.addMessage("Reconectando... Por favor espera un momento.", "assistant");
            return;
          }
          try {
            this.refs.sessionActive = false;
            this.safeEndSession();
          } catch (e) {
            console.error("[VoiceWidget] Error while forcing session end after onError:", e);
          }
          if (this.refs.mediaStream) {
            this.refs.mediaStream.getTracks().forEach((track) => track.stop());
            this.refs.mediaStream = null;
          }
          this.updateVoiceStatus("error");
          this.addMessage("Error de conexión. La llamada se terminó. Puedes volver a intentar o usar WhatsApp.", "assistant");
        },
        onStatusChange: (status) => {
          console.log("[VoiceWidget] Status changed:", status);
        },
        onModeChange: (mode) => {
          console.log("[VoiceWidget] Mode changed:", mode);
        }
      });
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
      console.log("[VoiceWidget] Session started successfully");
    } catch (error) {
      console.error("[VoiceWidget] ElevenLabs SDK error:", error);
      console.log("[VoiceWidget] Falling back to simulation mode");
      this.addMessage("El asistente de voz no está disponible en este momento. Puedes usar el chat de texto o contactarnos por WhatsApp.", "assistant");
      this.simulateVoiceConversation();
    }
  }
  async loadElevenLabsSDK() {
    return new Promise((resolve, reject) => {
      if (window.ElevenLabs && window.ElevenLabs.Conversation) {
        console.log("[VoiceWidget] ElevenLabs SDK already loaded");
        resolve();
        return;
      }
      const sdkUrls = [
        this.config.elevenLabsSDKUrl,
        "https://unpkg.com/@elevenlabs/client@0.5.0/dist/elevenlabs.min.js",
        "https://unpkg.com/@elevenlabs/client@latest/dist/elevenlabs.min.js",
        "https://cdn.jsdelivr.net/npm/@elevenlabs/client@0.5.0/dist/elevenlabs.min.js"
      ];
      console.log("[VoiceWidget] Trying to load ElevenLabs SDK...");
      const existingScript = document.querySelector('script[src*="@elevenlabs/client"]');
      if (existingScript) {
        console.log("[VoiceWidget] Removing existing SDK script");
        existingScript.remove();
      }
      const tryLoadSDK = (urlIndex = 0) => {
        if (urlIndex >= sdkUrls.length) {
          console.error("[VoiceWidget] All SDK URLs failed to load");
          console.log("[VoiceWidget] Will continue in simulation mode");
          resolve();
          return;
        }
        const url = sdkUrls[urlIndex];
        console.log("[VoiceWidget] Trying SDK URL:", url);
        const script = document.createElement("script");
        script.src = url;
        script.crossOrigin = "anonymous";
        script.onload = () => {
          var _a;
          console.log("[VoiceWidget] ElevenLabs SDK script loaded from:", url);
          console.log("[VoiceWidget] window.ElevenLabs:", window.ElevenLabs);
          console.log("[VoiceWidget] window.ElevenLabs.Conversation:", (_a = window.ElevenLabs) == null ? void 0 : _a.Conversation);
          setTimeout(() => {
            if (window.ElevenLabs && window.ElevenLabs.Conversation) {
              console.log("[VoiceWidget] ElevenLabs SDK loaded successfully");
              resolve();
            } else {
              console.error("[VoiceWidget] ElevenLabs SDK loaded but Conversation not available");
              console.error("[VoiceWidget] Available properties:", Object.keys(window.ElevenLabs || {}));
              console.error("[VoiceWidget] window object keys:", Object.keys(window).filter((key) => key.includes("Eleven")));
              tryLoadSDK(urlIndex + 1);
            }
          }, 100);
        };
        script.onerror = (error) => {
          console.error("[VoiceWidget] Failed to load ElevenLabs SDK from:", url, error);
          tryLoadSDK(urlIndex + 1);
        };
        document.head.appendChild(script);
        console.log("[VoiceWidget] SDK script added to document head");
      };
      tryLoadSDK();
    });
  }
  // Las funciones onConnect, onDisconnect, onMessage, onError ahora están dentro de startElevenLabsSession
  stopVoiceCall() {
    try {
      this.safeEndSession();
      if (this.refs.mediaStream) {
        this.refs.mediaStream.getTracks().forEach((track) => track.stop());
        this.refs.mediaStream = null;
      }
    } catch (error) {
      console.error("[VoiceWidget] Error stopping call:", error);
    }
    this.refs.sessionActive = false;
    this.clearSimulationTimers();
    this.updateVoiceStatus("idle");
    this.state.messages = [];
    this.state.isMuted = false;
    if (this.onStopCallback) this.onStopCallback();
  }
  safeEndSession() {
    var _a, _b, _c, _d;
    try {
      if (this.refs.session && typeof this.refs.session === "object" && "conversation" in this.refs.session) {
        if (this.refs.session.reconnectTimeout) {
          clearTimeout(this.refs.session.reconnectTimeout);
          this.refs.session.reconnectTimeout = null;
        }
        if (this.refs.session.websocket) {
          this.refs.session.websocket.close(1e3, "Session ended by user");
          this.refs.session.websocket = null;
        }
        ((_a = this.refs.session.conversation) == null ? void 0 : _a.endSession) && this.refs.session.conversation.endSession();
        ((_b = this.refs.session.conversation) == null ? void 0 : _b.disconnect) && this.refs.session.conversation.disconnect();
      } else {
        ((_c = this.refs.session) == null ? void 0 : _c.endSession) && this.refs.session.endSession();
        ((_d = this.refs.session) == null ? void 0 : _d.disconnect) && this.refs.session.disconnect();
      }
      this.refs.session = null;
    } catch (e) {
      console.error("[VoiceWidget] Error ending ElevenLabs session:", e);
    }
  }
  toggleMute() {
    var _a;
    if (!((_a = this.refs.session) == null ? void 0 : _a.conversation)) {
      console.warn("[VoiceWidget] toggleMute called without active conversation");
      return;
    }
    try {
      this.refs.isMuted = !this.refs.isMuted;
      this.state.isMuted = this.refs.isMuted;
      if (typeof this.refs.session.conversation.setMicMuted === "function") {
        this.refs.session.conversation.setMicMuted(this.refs.isMuted);
      }
      if (this.onMuteChangeCallback) {
        this.onMuteChangeCallback(this.refs.isMuted);
      }
    } catch (error) {
      console.error("[VoiceWidget] Error toggling mute:", error);
    }
  }
  simulateVoiceConversation() {
    this.clearSimulationTimers();
    this.updateVoiceStatus("connected");
    this.addMessage("¡Hola! Soy tu asistente de UIC. Aunque el servicio de voz no está disponible en este momento, puedes escribirme tus preguntas y te ayudaré con información sobre nuestros programas.", "assistant");
    this.refs.session = {
      conversation: {
        sendUserMessage: (text) => {
          console.log("[VoiceWidget] Simulated text received:", text);
          setTimeout(() => {
            this.addMessage("Gracias por tu mensaje. Un asesor te contactará pronto para brindarte información detallada sobre nuestros programas.", "assistant");
          }, 1e3);
        },
        sendUserActivity: () => {
          console.log("[VoiceWidget] Simulated user activity");
        }
      },
      websocket: null,
      agentId: "simulated",
      token: "simulated",
      reconnectAttempts: 0,
      maxReconnectAttempts: 0,
      reconnectTimeout: null,
      isConnected: true,
      isInitialized: true
    };
    this.refs.sessionActive = true;
  }
  async sendTextMessage(text) {
    var _a;
    if (!text || !text.trim()) return;
    const messageText = text.trim();
    console.log("[VoiceWidget] Sending text message:", messageText);
    this.addMessage(messageText, "user");
    if (((_a = this.refs.session) == null ? void 0 : _a.conversation) && typeof this.refs.session.conversation.sendUserMessage === "function") {
      try {
        if (this.refs.session.conversation.sendUserActivity) {
          this.refs.session.conversation.sendUserActivity();
        }
        this.refs.session.conversation.sendUserMessage(messageText);
        console.log("[VoiceWidget] Text sent via conversation.sendUserMessage");
        return;
      } catch (error) {
        console.error("[VoiceWidget] Error with conversation.sendUserMessage:", error);
      }
    }
    if (this.refs.session) {
      const sentViaElevenLabs = this.sendTextToElevenLabs(this.refs.session, messageText);
      if (sentViaElevenLabs) {
        console.log("[VoiceWidget] Text sent successfully to ElevenLabs via fallback");
        return;
      }
    }
    console.log("[VoiceWidget] All ElevenLabs methods failed, using backend fallback");
    try {
      this.state.isTyping = true;
      if (this.onTypingChangeCallback) this.onTypingChangeCallback(true);
      let baseUrl = "";
      if (typeof this.config.chatApiUrl === "string" && this.config.chatApiUrl.trim()) {
        baseUrl = this.config.chatApiUrl.trim().replace(/\/$/, "");
      }
      const path = this.config.chatEndpoint || "/api/chat/send";
      const endpoint = baseUrl ? `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}` : path;
      console.log("[VoiceWidget] Sending to backend:", endpoint);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1e4);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          message: messageText,
          sessionId: `web-session-${Date.now()}`,
          userId: `web-user-${Date.now()}`,
          source: "website-widget"
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        const reply = data.response || data.message || "Gracias por tu mensaje. Te responderemos pronto.";
        this.addMessage(reply, "assistant");
      } else {
        const errorText = await response.text();
        throw new Error(`Backend response not ok (${response.status}): ${errorText}`);
      }
    } catch (error) {
      console.error("[VoiceWidget] Backend error:", error);
      if (error.name === "AbortError") {
        this.addMessage("La conexión tardó demasiado tiempo. Por favor, intenta nuevamente.", "assistant");
      } else if (error.message.includes("Failed to fetch")) {
        this.addMessage("No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.", "assistant");
      } else {
        this.addMessage("Gracias por tu mensaje. En breve un asesor te responderá.", "assistant");
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
    const textInput = document.getElementById("voice-widget-text-input");
    if (textInput) {
      if (status === "connected") {
        textInput.classList.remove("voice-widget-hidden");
      } else {
        textInput.classList.add("voice-widget-hidden");
      }
    }
  }
  clearSimulationTimers() {
    if (this.refs.transcriptionTimeout) {
      clearTimeout(this.refs.transcriptionTimeout);
      this.refs.transcriptionTimeout = null;
    }
    this.refs.simulationTimeouts.forEach((id) => clearTimeout(id));
    this.refs.simulationTimeouts = [];
  }
  onConfigError() {
    if (this.onShowToastCallback) {
      this.onShowToastCallback(
        "Asistente de voz no disponible",
        "Usa el chat de texto, WhatsApp o el formulario de contacto mientras terminamos la configuracion."
      );
    }
  }
  sendTextToElevenLabs(session, text) {
    var _a, _b;
    console.log("[VoiceWidget] Attempting to send text:", text);
    if (session.conversation && typeof session.conversation.sendUserMessage === "function") {
      try {
        (_b = (_a = session.conversation).sendUserActivity) == null ? void 0 : _b.call(_a);
        session.conversation.sendUserMessage(text.trim());
        console.log("[VoiceWidget] Text sent via conversation.sendUserMessage");
        return true;
      } catch (error) {
        console.error("[VoiceWidget] Error with conversation.sendUserMessage:", error);
      }
    }
    if (session.websocket && session.websocket.readyState === WebSocket.OPEN) {
      try {
        const payload = { type: "user_message", text: text.trim() };
        session.websocket.send(JSON.stringify(payload));
        console.log("[VoiceWidget] Text sent via session WebSocket");
        return true;
      } catch (error) {
        console.error("[VoiceWidget] Error sending via session WebSocket:", error);
      }
    }
    console.warn("[VoiceWidget] No available method to send text in current session mode");
    return false;
  }
  addMessage(text, type = "assistant") {
    if (!text) return;
    const message = {
      text,
      type,
      timestamp: Date.now()
    };
    this.state.messages = [...this.state.messages, message].slice(-100);
    if (this.onMessagesChangeCallback) {
      this.onMessagesChangeCallback(this.state.messages);
    }
  }
}
class VoiceWidgetUI {
  constructor(voiceWidgetCore) {
    this.voiceWidget = voiceWidgetCore;
    this.containerId = "voice-widget-root";
    this.elements = {};
  }
  render() {
    const widgetHTML = `
      <div id="voice-widget-container" class="voice-widget-container">
        <button id="voice-widget-fab" class="voice-widget-fab" aria-label="Abrir asistente de voz">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
        </button>

        <div id="voice-widget-panel" class="voice-widget-panel voice-widget-hidden">
          <div class="voice-widget-header">
            <div class="voice-widget-header-content">
              <button id="voice-widget-close" class="voice-widget-close-btn" aria-label="Cerrar">&times;</button>
              <div class="voice-widget-header-left">
                <div class="voice-widget-header-text">
                  <h3>Asistente UIC</h3>
                  <p>Elige como quieres comunicarte</p>
                </div>
                <div class="voice-widget-status">
                  <div class="voice-widget-status-dot"></div>
                  <span class="voice-widget-status-text">Listo para conversar</span>
                </div>
              </div>
            </div>
          </div>

          <div id="voice-widget-messages" class="voice-widget-messages"></div>

          <!-- Input de texto para conversacion -->
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
                <div class="voice-widget-controls-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" x2="12" y1="19" y2="22"></line>
                  </svg>
                  <div>
                    <p class="voice-widget-controls-title">Conversacion por voz</p>
                    <p class="voice-widget-controls-subtitle">Habla directamente con el asistente IA</p>
                  </div>
                </div>
                <div class="voice-widget-controls-buttons">
                  <button id="voice-widget-mic-btn" class="voice-widget-control-btn voice-widget-mic-btn">
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
            </div>
          </div>
          <div id="voice-widget-no-config-msg" class="voice-widget-no-config voice-widget-hidden">
            El asistente de voz estara disponible en breve. Mientras tanto puedes usar el chat de texto, WhatsApp o el formulario de contacto.
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
    const wrapper = document.createElement("div");
    wrapper.innerHTML = widgetHTML;
    container.appendChild(wrapper.firstElementChild);
    this.cacheElements();
  }
  cacheElements() {
    this.elements = {
      fab: document.getElementById("voice-widget-fab"),
      panel: document.getElementById("voice-widget-panel"),
      closeBtn: document.getElementById("voice-widget-close"),
      messages: document.getElementById("voice-widget-messages"),
      textInput: document.getElementById("voice-widget-text-input"),
      textField: document.getElementById("voice-widget-input-field"),
      sendBtn: document.getElementById("voice-widget-send-btn"),
      callBtn: document.getElementById("voice-widget-call-btn"),
      muteBtn: document.getElementById("voice-widget-mic-btn"),
      statusDot: document.querySelector(".voice-widget-status-dot"),
      statusText: document.querySelector(".voice-widget-status-text"),
      noConfigMsg: document.getElementById("voice-widget-no-config-msg"),
      toast: document.getElementById("voice-widget-toast"),
      toastTitle: document.getElementById("voice-widget-toast-title"),
      toastMessage: document.getElementById("voice-widget-toast-message")
    };
  }
  togglePanel(isOpen) {
    if (isOpen) {
      this.elements.panel.classList.remove("voice-widget-hidden");
      this.elements.panel.classList.add("voice-widget-open");
    } else {
      this.elements.panel.classList.add("voice-widget-hidden");
      this.elements.panel.classList.remove("voice-widget-open");
    }
  }
  showTextInput(show) {
    if (show) {
      this.elements.textInput.classList.remove("voice-widget-hidden");
    } else {
      this.elements.textInput.classList.add("voice-widget-hidden");
    }
  }
  updateMessages(messages, isTyping = false) {
    this.elements.messages.innerHTML = messages.map((msg) => `
      <div class="voice-widget-message voice-widget-message-${msg.type}">
        <div class="voice-widget-message-bubble">
          <p>${this.escapeHtml(msg.text)}</p>
          <span class="voice-widget-message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    `).join("");
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
    const statusDot = this.elements.statusDot;
    const statusText = this.elements.statusText;
    const callBtn = document.getElementById("voice-widget-call-btn");
    const micBtn = document.getElementById("voice-widget-mic-btn");
    const noConfigMsg = document.getElementById("voice-widget-no-config-msg");
    if (statusDot && statusText) {
      switch (status) {
        case "connected":
          statusDot.style.background = "var(--voice-widget-success)";
          statusText.textContent = "Conversacion activa";
          if (callBtn) {
            callBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><span>Terminar</span>';
            callBtn.classList.add("voice-widget-call-btn-active");
          }
          if (micBtn) micBtn.style.display = "flex";
          break;
        case "connecting":
        case "getting-token":
          statusDot.style.background = "var(--voice-widget-warning)";
          statusText.textContent = status === "connecting" ? "Conectando..." : "Obteniendo token...";
          if (callBtn) {
            callBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><span>Conectando...</span>';
            callBtn.classList.remove("voice-widget-call-btn-active");
          }
          if (micBtn) micBtn.style.display = "none";
          break;
        case "error":
          statusDot.style.background = "var(--voice-widget-danger)";
          statusText.textContent = "Error de conexion";
          if (callBtn) {
            callBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><span>Iniciar llamada</span>';
            callBtn.classList.remove("voice-widget-call-btn-active");
          }
          if (micBtn) micBtn.style.display = "none";
          break;
        default:
          statusDot.style.background = "rgba(255, 255, 255, 0.7)";
          statusText.textContent = hasConfig ? "Listo para conversar" : "Configuracion pendiente";
          if (callBtn) {
            callBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><span>Iniciar llamada</span>';
            callBtn.classList.remove("voice-widget-call-btn-active");
          }
          if (micBtn) micBtn.style.display = "none";
      }
    }
    if (noConfigMsg) {
      if (!hasConfig && status !== "connected") {
        noConfigMsg.classList.remove("voice-widget-hidden");
      } else {
        noConfigMsg.classList.add("voice-widget-hidden");
      }
    }
  }
  updateMuteButton(isMuted) {
    const micBtn = document.getElementById("voice-widget-mic-btn");
    if (micBtn) {
      const unmutedIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>`;
      const mutedIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 9v3a3 3 0 0 0 5.12 2.12"></path><path d="M15 9.34V5a3 3 0 0 0-5.11-2.12"></path><path d="M19 10v2a7 7 0 0 1-10.59 5.8"></path><path d="M5 10v2a7 7 0 0 0 7 7"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      if (isMuted) {
        micBtn.classList.add("muted");
        micBtn.innerHTML = mutedIcon;
        micBtn.setAttribute("aria-label", "Activar microfono");
      } else {
        micBtn.classList.remove("muted");
        micBtn.innerHTML = unmutedIcon;
        micBtn.setAttribute("aria-label", "Silenciar microfono");
      }
      micBtn.setAttribute("aria-pressed", String(isMuted));
    }
  }
  showToast(title, message, duration = 3e3) {
    this.elements.toastTitle.textContent = title;
    this.elements.toastMessage.textContent = message;
    this.elements.toast.classList.remove("voice-widget-hidden");
    setTimeout(() => {
      this.elements.toast.classList.add("voice-widget-hidden");
    }, duration);
  }
  clearTextInput() {
    this.elements.textField.value = "";
  }
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("[VoiceWidget] Initializing with Vite bundler...");
  try {
    const voiceWidget = new VoiceWidgetCore(VoiceWidgetConfig);
    const voiceWidgetUI = new VoiceWidgetUI(voiceWidget);
    voiceWidgetUI.render();
    voiceWidgetUI.attachEventListeners();
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
    console.log("[VoiceWidget] Initialized successfully with Vite");
  } catch (error) {
    console.error("[VoiceWidget] Initialization error:", error);
  }
});
