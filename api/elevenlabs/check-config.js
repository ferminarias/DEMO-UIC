/**
 * Vercel Serverless Function
 * GET /api/elevenlabs/check-config
 * Verifica si ElevenLabs está configurado correctamente
 */

export default async function handler(req, res) {
  // Solo permitir método GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const hasApiKey = !!process.env.ELEVENLABS_API_KEY;
  const hasAgentId = !!process.env.ELEVENLABS_AGENT_ID;
  const isConfigured = hasApiKey && hasAgentId;

  return res.status(200).json({
    configured: isConfigured,
    details: {
      hasApiKey,
      hasAgentId,
      missing: [
        ...(!hasApiKey ? ['ELEVENLABS_API_KEY'] : []),
        ...(!hasAgentId ? ['ELEVENLABS_AGENT_ID'] : []),
      ],
    },
  });
}
