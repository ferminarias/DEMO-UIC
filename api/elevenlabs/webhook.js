/**
 * Vercel Serverless Function
 * POST /api/elevenlabs/webhook
 * Recibe eventos de ElevenLabs via webhook con streaming completo
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener el body como texto - igual que ULINEA
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature = req.headers['elevenlabs-signature'];

    // Verificación de firma HMAC si está configurada
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
      if (signature !== expectedSignature) {
        console.error('[UIC] Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Parsear el body - igual que ULINEA
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    console.log('[UIC] ElevenLabs webhook event:', event.type, event.data);

    switch (event.type) {
      case 'voice_deletion_warning':
        console.log('[UIC] Voice deletion warning:', event.data);
        break;

      case 'transcription_completed':
        console.log('[UIC] Transcription completed - Full data:', JSON.stringify(event.data, null, 2));
        console.log('[UIC] Transcription text:', event.data?.transcription || event.data?.text || 'No text found');

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
        console.log('[UIC] Conversation message:', JSON.stringify(event.data, null, 2));

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
        console.log('[UIC] Agent response:', JSON.stringify(event.data, null, 2));

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
        console.log('[UIC] Unknown webhook event type:', event.type, 'Data:', JSON.stringify(event.data, null, 2));
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[UIC] Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
