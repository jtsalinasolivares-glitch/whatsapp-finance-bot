import axios from 'axios';

const GRAPH_API_VERSION = 'v20.0';

function getClient() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error('Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID en las variables de entorno');
  }

  return axios.create({
    baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}`,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}

export async function sendTextMessage(to, body) {
  const client = getClient();
  try {
    await client.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    });
  } catch (err) {
    console.error('Error enviando mensaje:', err.response?.data || err.message);
    throw err;
  }
}

export async function markAsRead(messageId) {
  const client = getClient();
  try {
    await client.post('/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    });
  } catch (err) {
    console.warn('No se pudo marcar como leído:', err.response?.data || err.message);
  }
}
