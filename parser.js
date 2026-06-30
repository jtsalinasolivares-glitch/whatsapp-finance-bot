import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'finance.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('gasto', 'ingreso')),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS budgets (
    phone TEXT NOT NULL,
    category TEXT NOT NULL,
    monthly_limit REAL NOT NULL,
    PRIMARY KEY (phone, category)
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_phone ON transactions(phone);
  CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
`);

export function addTransaction(phone, type, amount, category, note) {
  const stmt = db.prepare(`
    INSERT INTO transactions (phone, type, amount, category, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(phone, type, amount, category, note || null);
}

export function getTransactionsThisMonth(phone) {
  const stmt = db.prepare(`
    SELECT * FROM transactions
    WHERE phone = ?
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    ORDER BY created_at DESC
  `);
  return stmt.all(phone);
}

export function getTransactionsByRange(phone, startDate, endDate) {
  const stmt = db.prepare(`
    SELECT * FROM transactions
    WHERE phone = ? AND created_at >= ? AND created_at <= ?
    ORDER BY created_at DESC
  `);
  return stmt.all(phone, startDate, endDate);
}

export function getLastTransactions(phone, limit = 10) {
  const stmt = db.prepare(`
    SELECT * FROM transactions
    WHERE phone = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);
  return stmt.all(phone, limit);
}

export function deleteLastTransaction(phone) {
  const last = db.prepare(`
    SELECT id FROM transactions WHERE phone = ? ORDER BY created_at DESC LIMIT 1
  `).get(phone);
  if (!last) return false;
  db.prepare(`DELETE FROM transactions WHERE id = ?`).run(last.id);
  return true;
}

export function setBudget(phone, category, limit) {
  const stmt = db.prepare(`
    INSERT INTO budgets (phone, category, monthly_limit)
    VALUES (?, ?, ?)
    ON CONFLICT(phone, category) DO UPDATE SET monthly_limit = excluded.monthly_limit
  `);
  return stmt.run(phone, category, limit);
}

export function getBudgets(phone) {
  const stmt = db.prepare(`SELECT * FROM budgets WHERE phone = ?`);
  return stmt.all(phone);
}

export default db;
