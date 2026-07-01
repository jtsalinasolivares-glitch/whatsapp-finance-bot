const CATEGORY_KEYWORDS = {
  comida: ['comida', 'super', 'supermercado', 'restaurante', 'almuerzo', 'cena', 'desayuno', 'mercado', 'cafe', 'café'],
  transporte: ['transporte', 'gasolina', 'uber', 'taxi', 'bus', 'metro', 'parking', 'peaje', 'combustible'],
  vivienda: ['alquiler', 'renta', 'hipoteca', 'luz', 'agua', 'gas', 'internet', 'electricidad'],
  ocio: ['ocio', 'cine', 'salida', 'fiesta', 'bar', 'streaming', 'netflix', 'spotify', 'videojuego'],
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

function extractAmount(text) {
  const match = text.match(/(\d+([.,]\d{1,2})?)/);
  if (!match) return null;
  return parseFloat(match[1].replace(',', '.'));
}

export function parseTransactionMessage(text) {
  const lower = text.toLowerCase().trim();

  const isIncome = /(^|\s)(ingreso|ingrese|ingresé|recibi|recibí|cobre|cobré|me pagaron|sueldo|salario)(\s|$)/u.test(lower)
    || lower.startsWith('+');

  const isExpense = /(^|\s)(gaste|gasté|gasto|pague|pagué|compre|compré)(\s|$)/u.test(lower)
    || lower.startsWith('-');

  if (!isIncome && !isExpense) return null;

  const amount = extractAmount(lower);
  if (!amount || amount <= 0) return null;

  return {
    type: isIncome ? 'ingreso' : 'gasto',
    amount,
    category: guessCategory(lower),
    note: text.trim()
  };
}

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
