/**
 * Vercel Serverless Function
 * POST /api/elevenlabs/webhook
 * Recibe eventos de ElevenLabs via webhook
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['elevenlabs-signature'];

    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('[VoiceWidget] Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = typeof req.body === 'string' ? JSON.parse(body) : req.body;
    console.log('[VoiceWidget] ElevenLabs webhook event:', event.type, event.data);

    switch (event.type) {
      case 'voice_deletion_warning':
        console.log('[VoiceWidget] Voice deletion warning:', event.data);
        break;

      case 'transcription_completed':
        console.log(
          '[VoiceWidget] Transcription completed - Full data:',
          JSON.stringify(event.data, null, 2)
        );
        console.log(
          '[VoiceWidget] Transcription text:',
          event.data?.transcription || event.data?.text || 'No text found'
        );

        // Aquí puedes procesar la transcripción si lo necesitas
        // Por ejemplo, guardar en base de datos
        break;

      case 'conversation_message':
        console.log(
          '[VoiceWidget] Conversation message:',
          JSON.stringify(event.data, null, 2)
        );

        // Aquí puedes procesar mensajes de la conversación
        break;

      case 'agent_response':
        console.log(
          '[VoiceWidget] Agent response:',
          JSON.stringify(event.data, null, 2)
        );

        // Aquí puedes procesar respuestas del agente
        break;

      default:
        console.log(
          '[VoiceWidget] Unknown webhook event type:',
          event.type,
          'Data:',
          JSON.stringify(event.data, null, 2)
        );
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[VoiceWidget] Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
