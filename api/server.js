/**
 * Voice Widget API Server
 * Backend para manejar conexiones con ElevenLabs
 * Replicado desde UlineaUniversidad Next.js API routes
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fetchFn = (...args) => (global.fetch ? global.fetch(...args) : import('node-fetch').then(({ default: fetch }) => fetch(...args)));
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text());

// Configuración de ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const ELEVENLABS_WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET;

// Dominios permitidos para seguridad (igual que UlineaUniversidad)
const ALLOWED_DOMAINS = process.env.ALLOWED_EMBED_DOMAINS?.split(',') || [
  'localhost',
  '127.0.0.1',
  'demo-uic.vercel.app',
  'bot.dominiodepruebas.online',
  'bot.ddev.site',
];

// Validar origen de las peticiones (igual que UlineaUniversidad)
function validateOrigin(req, res, next) {
  const origin = req.headers.origin || req.headers.referer || '';
  const userAgent = req.headers['user-agent'] || '';
  
  const isAuthorized = ALLOWED_DOMAINS.some(domain => 
    origin.includes(domain) || 
    origin.includes('localhost') ||
    !origin // Permitir requests directos para compatibilidad
  );
  
  if (!isAuthorized && origin) {
    console.warn(`[SECURITY] Token request from unauthorized origin: ${origin}`);
    console.warn(`[DEBUG] Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
    console.warn(`[DEBUG] Current origin: ${origin}`);
    return res.status(403).json({
      error: 'Acceso denegado desde este dominio',
      configured: false,
    });
  }
  
  next();
}

/**
 * GET /api/elevenlabs/check-config
 * Verifica si ElevenLabs está configurado
 */
app.get('/api/elevenlabs/check-config', (req, res) => {
  const hasApiKey = !!ELEVENLABS_API_KEY;
  const hasAgentId = !!ELEVENLABS_AGENT_ID;
  const isConfigured = hasApiKey && hasAgentId;

  res.json({
    configured: isConfigured,
    details: {
      hasApiKey,
      hasAgentId,
      missing: [
        ...(!hasApiKey ? ['ELEVENLABS_API_KEY'] : []),
        ...(!hasAgentId ? ['ELEVENLABS_AGENT_ID'] : [])
      ]
    }
  });
});

/**
 * GET /api/elevenlabs/token
 * Genera un token de conversación para ElevenLabs
 * Replicado exactamente desde UlineaUniversidad
 */
app.get('/api/elevenlabs/token', validateOrigin, async (req, res) => {
  try {
    // Get client IP for basic tracking (igual que UlineaUniversidad)
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.ip || 
                     'unknown';

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
      return res.status(200).json({
        error: 'ElevenLabs no está configurado. El asistente de voz estará disponible una vez completada la configuración.',
        configured: false,
      });
    }

    try {
      const tokenResponse = await fetchFn(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('ElevenLabs token generation failed:', errorText);

        return res.json({
          agentId: ELEVENLABS_AGENT_ID,
          configured: true,
          tokenGenerated: false,
          fallbackMode: true,
          error: `Token generation failed: ${errorText}`,
        });
      }

      const tokenData = await tokenResponse.json();

      return res.json({
        token: tokenData.token,
        agentId: ELEVENLABS_AGENT_ID,
        configured: true,
        tokenGenerated: true,
        clientIp: clientIp, // For debugging purposes
      });
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.json({
        agentId: ELEVENLABS_AGENT_ID,
        configured: true,
        tokenGenerated: false,
        fallbackMode: true,
        error: tokenError.message || 'Unknown error',
      });
    }
  } catch (error) {
    console.error('ElevenLabs token error:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      configured: false,
    });
  }
});

/**
 * POST /api/chat/send
 * Fallback simple cuando ElevenLabs no está disponible
 */
app.post('/api/chat/send', validateOrigin, async (req, res) => {
  try {
    const { message, sessionId, userId, source } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'El campo "message" es obligatorio.' });
    }

    console.log('[UIC Chat Fallback] Received message:', message, 'from:', source);

    // Respuesta simple de fallback - igual que ULINEA
    const response = 'Gracias por tu mensaje. Un asesor te contactará pronto.';

    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('[UIC Chat Fallback] Sending response:', response);

    return res.json({
      response: response,
      message: response,
      sessionId: sessionId || `web-session-${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[UIC Chat Fallback] Error processing message:', error);
    return res.status(500).json({
      error: 'Error interno del servidor. Por favor, intenta nuevamente o contacta a un asesor.',
      response: 'Gracias por tu mensaje. Un asesor te contactará pronto.'
    });
  }
});

/**
 * POST /api/elevenlabs/webhook
 * Webhook para recibir eventos de ElevenLabs
 * Replicado exactamente desde UlineaUniversidad
 */
app.post('/api/elevenlabs/webhook', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['elevenlabs-signature'];

    // Verificar firma si está configurado el secret (igual que UlineaUniversidad)
    if (ELEVENLABS_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', ELEVENLABS_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[DEMO-UIC] Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(body) : req.body;
    console.log('[DEMO-UIC] ElevenLabs webhook event:', event.type, event.data);

    switch (event.type) {
      case 'voice_deletion_warning':
        console.log('[DEMO-UIC] Voice deletion warning:', event.data);
        break;

      case 'transcription_completed':
        console.log('[DEMO-UIC] Transcription completed - Full data:', JSON.stringify(event.data, null, 2));
        console.log('[DEMO-UIC] Transcription text:', event.data?.transcription || event.data?.text || 'No text found');

        // Streaming de transcripción si hay controlador activo
        if (global.transcriptionController) {
          const encoder = new TextEncoder();
          const transcriptionText = event.data?.transcription || event.data?.text;
          if (transcriptionText) {
            const data = encoder.encode(
              `data: ${JSON.stringify({
                type: 'transcription',
                text: transcriptionText,
                timestamp: Date.now(),
                source: event.data?.source || 'assistant',
              })}\n\n`
            );
            global.transcriptionController.enqueue(data);
          }
        }
        break;

      case 'conversation_message':
        console.log('[DEMO-UIC] Conversation message:', JSON.stringify(event.data, null, 2));

        // Streaming de mensajes de conversación
        if (global.transcriptionController) {
          const encoder = new TextEncoder();
          const messageText = event.data?.message || event.data?.text;
          if (messageText) {
            const data = encoder.encode(
              `data: ${JSON.stringify({
                type: 'message',
                text: messageText,
                timestamp: Date.now(),
                source: event.data?.source || 'assistant',
              })}\n\n`
            );
            global.transcriptionController.enqueue(data);
          }
        }
        break;

      case 'agent_response':
        console.log('[DEMO-UIC] Agent response:', JSON.stringify(event.data, null, 2));

        // Streaming de respuestas del agente
        if (global.transcriptionController) {
          const encoder = new TextEncoder();
          const responseText = event.data?.response || event.data?.text;
          if (responseText) {
            const data = encoder.encode(
              `data: ${JSON.stringify({
                type: 'response',
                text: responseText,
                timestamp: Date.now(),
                source: 'assistant',
              })}\n\n`
            );
            global.transcriptionController.enqueue(data);
          }
        }
        break;

      default:
        console.log('[DEMO-UIC] Unknown webhook event type:', event.type, 'Data:', JSON.stringify(event.data, null, 2));
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('[DEMO-UIC] Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    elevenLabsConfigured: !!(ELEVENLABS_API_KEY && ELEVENLABS_AGENT_ID)
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[DEMO-UIC] Voice Widget API Server running on port ${PORT}`);
  console.log(`[DEMO-UIC] ElevenLabs configured: ${!!(ELEVENLABS_API_KEY && ELEVENLABS_AGENT_ID)}`);
  console.log(`[DEMO-UIC] Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`);
});

module.exports = app;
