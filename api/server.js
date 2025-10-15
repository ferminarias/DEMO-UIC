/**
 * Voice Widget API Server
 * Backend para manejar conexiones con ElevenLabs
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
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

// Dominios permitidos para seguridad
const ALLOWED_DOMAINS = process.env.ALLOWED_EMBED_DOMAINS?.split(',') || [
  'localhost',
  '127.0.0.1',
];

// Validar origen de las peticiones
function validateOrigin(req, res, next) {
  const origin = req.headers.origin || req.headers.referer || '';
  const userAgent = req.headers['user-agent'] || '';
  
  const isAuthorized = ALLOWED_DOMAINS.some(domain => 
    origin.includes(domain) || 
    origin.includes('localhost') ||
    !origin
  );
  
  if (!isAuthorized && origin) {
    console.warn(`[SECURITY] Unauthorized origin: ${origin}`);
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
 */
app.get('/api/elevenlabs/token', validateOrigin, async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.ip || 
                     'unknown';

    if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
      return res.json({
        error: 'ElevenLabs no está configurado. El asistente de voz estará disponible una vez completada la configuración.',
        configured: false,
      });
    }

    try {
      const tokenResponse = await fetch(
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
        clientIp: clientIp,
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
 * POST /api/elevenlabs/webhook
 * Webhook para recibir eventos de ElevenLabs
 */
app.post('/api/elevenlabs/webhook', async (req, res) => {
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['elevenlabs-signature'];

    // Verificar firma si está configurado el secret
    if (ELEVENLABS_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', ELEVENLABS_WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(body) : req.body;
    console.log('[Webhook] Event:', event.type, event.data);

    switch (event.type) {
      case 'voice_deletion_warning':
        console.log('[Webhook] Voice deletion warning:', event.data);
        break;

      case 'transcription_completed':
        console.log('[Webhook] Transcription completed:', event.data?.transcription || event.data?.text);
        // Aquí puedes procesar la transcripción si lo necesitas
        break;

      case 'conversation_message':
        console.log('[Webhook] Conversation message:', event.data?.message || event.data?.text);
        // Aquí puedes procesar mensajes de la conversación
        break;

      case 'agent_response':
        console.log('[Webhook] Agent response:', event.data?.response || event.data?.text);
        // Aquí puedes procesar respuestas del agente
        break;

      default:
        console.log('[Webhook] Unknown event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
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
  console.log(`Voice Widget API Server running on port ${PORT}`);
  console.log(`ElevenLabs configured: ${!!(ELEVENLABS_API_KEY && ELEVENLABS_AGENT_ID)}`);
});

module.exports = app;
