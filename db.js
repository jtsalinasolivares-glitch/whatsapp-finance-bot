import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'finance-data.json');

function loadData() {
  if (!fs.existsSync(DB_PATH)) {
    return { transactions: [], budgets: [] };
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error leyendo la base de datos, empezando de cero:', err.message);
    return { transactions: [], budgets: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function nowISO() {
  return new Date().toISOString();
}

function currentYearMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function addTransaction(phone, type, amount, category, note) {
  const data = loadData();
  const transaction = {
    id: Date.now() + Math.random().toString(36).slice(2, 8),
    phone, type, amount, category,
    note: note || null,
    created_at: nowISO()
  };
  data.transactions.push(transaction);
  saveData(data);
  return transaction;
}

export function getTransactionsThisMonth(phone) {
  const data = loadData();
  const ym = currentYearMonth();
  return data.transactions
    .filter(t => t.phone === phone && t.created_at.slice(0, 7) === ym)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getLastTransactions(phone, limit = 10) {
  const data = loadData();
  return data.transactions
    .filter(t => t.phone === phone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function deleteLastTransaction(phone) {
  const data = loadData();
  const userTxs = data.transactions
    .filter(t => t.phone === phone)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (userTxs.length === 0) return false;
  const lastId = userTxs[0].id;
  data.transactions = data.transactions.filter(t => t.id !== lastId);
  saveData(data);
  return true;
}

export function setBudget(phone, category, limit) {
  const data = loadData();
  const existing = data.budgets.find(b => b.phone === phone && b.category === category);
  if (existing) {
    existing.monthly_limit = limit;
  } else {
    data.budgets.push({ phone, category, monthly_limit: limit });
  }
  saveData(data);
}

export function getBudgets(phone) {
  const data = loadData();
  return data.budgets.filter(b => b.phone === phone);
}
