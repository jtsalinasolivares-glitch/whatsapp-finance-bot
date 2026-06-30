// Categorías reconocidas automáticamente por palabras clave
const CATEGORY_KEYWORDS = {
  comida: ['comida', 'super', 'supermercado', 'restaurante', 'almuerzo', 'cena', 'desayuno', 'mercado', 'cafe', 'café'],
  transporte: ['transporte', 'gasolina', 'uber', 'taxi', 'bus', 'metro', 'parking', 'peaje', 'combustible'],
  vivienda: ['alquiler', 'renta', 'hipoteca', 'luz', 'agua', 'gas', 'internet', 'electricidad'],
  ocio: ['ocio', 'cine', 'salida', 'fiesta', 'bar', 'streaming', 'netflix', 'spotify', 'videojuego', 'juego'],
  salud: ['salud', 'farmacia', 'medico', 'médico', 'doctor', 'dentista', 'gimnasio', 'gym'],
  ropa: ['ropa', 'zapatos', 'zapatillas', 'tienda'],
  educacion: ['curso', 'libro', 'educacion', 'educación', 'universidad', 'colegio'],
  trabajo: ['sueldo', 'salario', 'nomina', 'nómina', 'freelance', 'proyecto'],
  otros: []
};

function guessCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return category;
  }
  return 'otros';
}

// Extrae un número (monto) del texto, soportando "10.50", "10,50", "10"
function extractAmount(text) {
  const match = text.match(/(\d+([.,]\d{1,2})?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

/**
 * Intenta interpretar un mensaje libre como una transacción.
 * Ejemplos que reconoce:
 *  "gaste 20 en comida"
 *  "gasto 15.50 transporte uber al aeropuerto"
 *  "ingreso 1200 sueldo"
 *  "recibi 50 de un amigo"
 *  "+50 regalo"
 *  "-20 comida"
 */
export function parseTransactionMessage(text) {
  const lower = text.toLowerCase().trim();

  const isIncome = /(^|\s)(ingreso|ingrese|ingresé|recibi|recibí|cobre|cobré|me pagaron|sueldo|salario)(\s|$)/u.test(lower)
    || lower.startsWith('+');

  const isExpense = /(^|\s)(gaste|gasté|gasto|pague|pagué|compre|compré)(\s|$)/u.test(lower)
    || lower.startsWith('-');

  if (!isIncome && !isExpense) return null;

  const amount = extractAmount(lower);
  if (!amount || amount <= 0) return null;

  const category = guessCategory(lower);

  return {
    type: isIncome ? 'ingreso' : 'gasto',
    amount,
    category,
    note: text.trim()
  };
}

/**
 * Detecta comandos especiales (no transacciones).
 * Devuelve { command, args } o null si no es un comando reconocido.
 */
export function parseCommand(text) {
  const lower = text.toLowerCase().trim();

  if (['hola', 'inicio', 'start', 'ayuda', 'help', 'menu', 'menú'].includes(lower)) {
    return { command: 'help' };
  }
  if (['resumen', 'resumen mes', 'balance', 'estado'].includes(lower)) {
    return { command: 'summary' };
  }
  if (['historial', 'ultimos', 'últimos', 'movimientos'].includes(lower)) {
    return { command: 'history' };
  }
  if (['borrar', 'borrar ultimo', 'deshacer', 'undo'].includes(lower)) {
    return { command: 'undo' };
  }
  if (lower.startsWith('presupuesto ')) {
    // "presupuesto comida 200"
    const parts = lower.split(' ').filter(Boolean);
    if (parts.length >= 3) {
      const category = parts[1];
      const limit = parseFloat(parts[2].replace(',', '.'));
      if (!isNaN(limit)) {
        return { command: 'set_budget', args: { category, limit } };
      }
    }
  }

  return null;
}

export { guessCategory, extractAmount };
