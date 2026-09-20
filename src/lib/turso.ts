import { createClient } from '@libsql/client/web';
import type { Client } from '@libsql/client/web';

const rawUrl = import.meta.env.VITE_TURSO_DATABASE_URL || 'https://hazeebus-prachuforwalid.aws-ap-south-1.turso.io';
const rawAuthToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk5MjMyODcsImlkIjoiMDFhMGJmYjItZWIwMS03Yzg1LWExNzktMmIxMjU0NzEzNjFkIiwia2lkIjoiWk0wSWo1bHY1N1FLajVfRVp6cjV3M1VROGs5MjZuRmFwUnpUdThpX040USIsInJpZCI6IjhkMDZhNzdmLTgzMDUtNDg3Yi04MTUyLTM1ZjI5ZjU4NjllMSJ9.K6eGD7ZvWV7xfpCdYDmfBLzOfRCAoHlDaOMwB7COT8tfphfpYcZpPrUp-YHkUfAwYm-FxNSwzY71o8AVDyE2Dg';

// Ensure browser-compatible HTTPS URL
const sanitizedUrl = rawUrl.startsWith('libsql://')
  ? rawUrl.replace('libsql://', 'https://')
  : rawUrl;

export const isTursoConfigured = Boolean(
  sanitizedUrl &&
  rawAuthToken &&
  !sanitizedUrl.includes('your-database-name')
);

export const turso: Client | null = isTursoConfigured
  ? createClient({
      url: sanitizedUrl,
      authToken: rawAuthToken,
    })
  : null;

export function isDatabaseConnected(): boolean {
  return isTursoConfigured && turso !== null;
}

/**
 * Ensure database schema exists on client init
 */
export async function ensureTursoSchema(): Promise<void> {
  if (!turso) return;

  try {
    await turso.batch([
      `CREATE TABLE IF NOT EXISTS daily_transactions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        amount REAL NOT NULL CHECK (amount > 0),
        category TEXT NOT NULL,
        description TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        created_by TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS investments (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        owner TEXT NOT NULL,
        amount REAL NOT NULL CHECK (amount > 0),
        description TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        created_by TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_tx_date ON daily_transactions (date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_tx_type ON daily_transactions (type)`,
      `CREATE INDEX IF NOT EXISTS idx_tx_category ON daily_transactions (category)`,
      `CREATE INDEX IF NOT EXISTS idx_inv_date ON investments (date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_inv_owner ON investments (owner)`,
    ]);
  } catch (err) {
    console.warn('Auto-schema init notice:', err);
  }
}
