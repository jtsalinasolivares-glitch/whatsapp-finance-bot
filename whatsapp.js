import 'dotenv/config';
import express from 'express';
import { sendTextMessage, markAsRead } from './whatsapp.js';
import { parseTransactionMessage, parseCommand } from './parser.js';
import { addTransaction, deleteLastTransaction, setBudget } from './db.js';
import { buildHelpMessage, buildSummary, buildHistory, buildConfirmation } from './reports.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Healthcheck simple para Railway/Render
app.get('/', (req, res) => {
  res.send('🤖 Bot de finanzas activo');
});

// 1) VERIFICACIÓN DEL WEBHOOK (Meta hace este GET una sola vez al configurar)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verificado correctamente');
    return res.status(200).send(challenge);
  }
  console.warn('❌ Falló la verificación del webhook');
  return res.sendStatus(403);
});

// 2) RECEPCIÓN DE MENSAJES (Meta hace POST cada vez que alguien escribe al bot)
app.post('/webhook', async (req, res) => {
  // Responder rápido a Meta para que no reintente el webhook
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return; // Puede ser un evento de "status" (entregado/leído), lo ignoramos

    const from = message.from; // número del usuario
    const messageId = message.id;
    const text = message.text?.body;

    if (!text) {
      await sendTextMessage(from, 'Por ahora solo entiendo mensajes de texto. Escribe "ayuda" para ver qué puedo hacer.');
      return;
    }

    await markAsRead(messageId);
    await handleIncomingMessage(from, text);
  } catch (err) {
    console.error('Error procesando webhook:', err);
  }
});

async function handleIncomingMessage(from, text) {
  // 1. ¿Es un comando especial?
  const command = parseCommand(text);
  if (command) {
    switch (command.command) {
      case 'help':
        return sendTextMessage(from, buildHelpMessage());
      case 'summary':
        return sendTextMessage(from, buildSummary(from));
      case 'history':
        return sendTextMessage(from, buildHistory(from));
      case 'undo': {
        const deleted = deleteLastTransaction(from);
        return sendTextMessage(from, deleted
          ? '↩️ Eliminé tu último movimiento.'
          : 'No tienes movimientos para borrar.');
      }
      case 'set_budget': {
        setBudget(from, command.args.category, command.args.limit);
        return sendTextMessage(from, `🎯 Presupuesto fijado: ${capitalize(command.args.category)} → ${command.args.limit}${process.env.CURRENCY || '€'}/mes`);
      }
    }
  }

  // 2. ¿Es una transacción (gasto/ingreso)?
  const transaction = parseTransactionMessage(text);
  if (transaction) {
    addTransaction(from, transaction.type, transaction.amount, transaction.category, transaction.note);
    return sendTextMessage(from, buildConfirmation(transaction));
  }

  // 3. No entendimos el mensaje
  return sendTextMessage(from,
    'No entendí ese mensaje 🤔\n\nIntenta algo como "gasté 20 en comida" o escribe "ayuda" para ver todos los comandos.'
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
