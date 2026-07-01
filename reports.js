import { getTransactionsThisMonth, getLastTransactions, getBudgets } from './db.js';

const CURRENCY = process.env.CURRENCY || '$';

function fmt(amount) {
  return `${amount.toFixed(2)}${CURRENCY}`;
}

export function buildHelpMessage() {
  return `🤖 *Bot de Finanzas Personales*

Puedes escribirme cosas como:
- "gasté 20 en comida"
- "pagué 15.50 uber al trabajo"
- "ingreso 1200 sueldo"
- "+50 regalo de cumpleaños"
- "-8 café"

*Comandos:*
📊 *resumen* — balance del mes actual
📜 *historial* — tus últimos movimientos
↩️ *borrar* — elimina tu último movimiento
🎯 *presupuesto [categoría] [monto]* — fija un límite mensual
   ej: presupuesto comida 200`;
}

export function buildSummary(phone) {
  const transactions = getTransactionsThisMonth(phone);

  if (transactions.length === 0) {
    return '📊 Aún no tienes movimientos este mes. Escríbeme algo como "gasté 20 en comida" para empezar.';
  }

  const ingresos = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0);
  const gastos = transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
  const balance = ingresos - gastos;

  const porCategoria = {};
  for (const t of transactions.filter(t => t.type === 'gasto')) {
    porCategoria[t.category] = (porCategoria[t.category] || 0) + t.amount;
  }
  const categoriasOrdenadas = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  const budgets = getBudgets(phone);
  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.monthly_limit]));

  let msg = `📊 *Resumen del mes*\n\n`;
  msg += `💰 Ingresos: ${fmt(ingresos)}\n`;
  msg += `💸 Gastos: ${fmt(gastos)}\n`;
  msg += `${balance >= 0 ? '✅' : '⚠️'} Balance: ${fmt(balance)}\n\n`;

  if (categoriasOrdenadas.length > 0) {
    msg += `*Gastos por categoría:*\n`;
    for (const [cat, total] of categoriasOrdenadas) {
      const limit = budgetMap[cat];
      let line = `• ${capitalize(cat)}: ${fmt(total)}`;
      if (limit) {
        const pct = Math.round((total / limit) * 100);
        const icon = pct >= 100 ? '🔴' : pct >= 80 ? '🟡' : '🟢';
        line += ` (${pct}% de ${fmt(limit)} ${icon})`;
      }
      msg += line + '\n';
    }
  }

  return msg;
}

export function buildHistory(phone) {
  const transactions = getLastTransactions(phone, 10);

  if (transactions.length === 0) {
    return '📜 No tienes movimientos registrados todavía.';
  }

  let msg = `📜 *Tus últimos movimientos:*\n\n`;
  for (const t of transactions) {
    const icon = t.type === 'ingreso' ? '💰' : '💸';
    const sign = t.type === 'ingreso' ? '+' : '-';
    const date = new Date(t.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    msg += `${icon} ${sign}${fmt(t.amount)} · ${capitalize(t.category)} · ${date}\n`;
  }

  return msg;
}

export function buildConfirmation(transaction) {
  const icon = transaction.type === 'ingreso' ? '✅💰' : '✅💸';
  const verb = transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto';
  return `${icon} ${verb} registrado: ${fmt(transaction.amount)} en *${capitalize(transaction.category)}*\n\nEscribe "resumen" para ver tu balance.`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
