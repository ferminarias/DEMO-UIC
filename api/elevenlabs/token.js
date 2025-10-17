/**
 * Vercel Serverless Function
 * GET /api/elevenlabs/token
 * Genera un token de conversación para ElevenLabs
 */

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validación de origen para seguridad
    const origin = req.headers.origin || req.headers.referer || '';
    const userAgent = req.headers['user-agent'] || '';
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIp = forwarded?.split(',')[0] || realIp || 'unknown';
    
    // Lista de dominios autorizados
    const allowedDomains = process.env.ALLOWED_EMBED_DOMAINS?.split(',') || [
      'localhost',
      '127.0.0.1',
      'demo-uic.vercel.app', // Tu dominio DEMO-UIC
      'bot.dominiodepruebas.online',
      'bot.ddev.site',
      'wordpress.com',
      'wordpress.org'
    ];
    
    // Validar si está siendo usado desde dominio autorizado
    const isAuthorized = allowedDomains.some(domain => 
      origin.includes(domain) || 
      origin.includes('localhost') ||
      !origin // Permitir requests directos para compatibilidad
    );
    
    // Log sospechoso para monitoreo
    if (!isAuthorized && origin) {
      console.warn(`[UIC-SECURITY] Token request from unauthorized origin: ${origin}, IP: ${clientIp}, UA: ${userAgent}`);
      console.warn(`[UIC-DEBUG] Allowed domains: ${allowedDomains.join(', ')}`);
      console.warn(`[UIC-DEBUG] Current origin: ${origin}`);
      
      // Bloquear acceso no autorizado
      if (!origin.includes('demo-uic.vercel.app') && !origin.includes('localhost')) {
        return res.status(403).json({
          error: 'Acceso denegado desde este dominio',
          configured: false,
        });
      }
    }

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!elevenLabsApiKey || !agentId) {
      return res.status(200).json({
        error: 'ElevenLabs no está configurado. El asistente de voz estará disponible una vez completada la configuración.',
        configured: false,
      });
    }

    try {
      const tokenResponse = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
        {
          method: 'GET',
          headers: {
            'xi-api-key': elevenLabsApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('ElevenLabs token generation failed:', errorText);

        return res.status(200).json({
          agentId: agentId,
          configured: true,
          tokenGenerated: false,
          fallbackMode: true,
          error: `Token generation failed: ${errorText}`,
        });
      }

      const tokenData = await tokenResponse.json();

      return res.status(200).json({
        token: tokenData.token,
        agentId: agentId,
        configured: true,
        tokenGenerated: true,
        clientIp: clientIp, // For debugging purposes - igual que ULINEA
      });
    } catch (tokenError) {
      console.error('Token generation error:', tokenError);
      return res.status(200).json({
        agentId: agentId,
        configured: true,
        tokenGenerated: false,
        fallbackMode: true,
        error: tokenError.message || 'Unknown error',
      });
    }
  } catch (error) {
    console.error('ElevenLabs token error:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      configured: false,
    });
  }
}
