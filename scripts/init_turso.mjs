import { createClient } from '@libsql/client';

const url = 'https://hazeebus-prachuforwalid.aws-ap-south-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk5MjMyODcsImlkIjoiMDFhMGJmYjItZWIwMS03Yzg1LWExNzktMmIxMjU0NzEzNjFkIiwia2lkIjoiWk0wSWo1bHY1N1FLajVfRVp6cjV3M1VROGs5MjZuRmFwUnpUdThpX040USIsInJpZCI6IjhkMDZhNzdmLTgzMDUtNDg3Yi04MTUyLTM1ZjI5ZjU4NjllMSJ9.K6eGD7ZvWV7xfpCdYDmfBLzOfRCAoHlDaOMwB7COT8tfphfpYcZpPrUp-YHkUfAwYm-FxNSwzY71o8AVDyE2Dg';

async function main() {
  console.log('Connecting to Turso at:', url);
  const client = createClient({ url, authToken });

  console.log('Creating daily_transactions table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS daily_transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      description TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT
    )
  `);

  console.log('Creating investments table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      owner TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      description TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      created_by TEXT
    )
  `);

  console.log('Creating indexes...');
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_date ON daily_transactions (date DESC)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_type ON daily_transactions (type)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_tx_category ON daily_transactions (category)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_inv_date ON investments (date DESC)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_inv_owner ON investments (owner)`);

  const tables = await client.execute(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('Existing tables in Turso:', tables.rows.map(r => r.name));

  const txCount = await client.execute(`SELECT COUNT(*) as count FROM daily_transactions`);
  console.log('Transaction count:', txCount.rows[0].count);

  const invCount = await client.execute(`SELECT COUNT(*) as count FROM investments`);
  console.log('Investment count:', invCount.rows[0].count);

  console.log('SUCCESS: Turso database initialized and connected perfectly!');
}

main().catch(console.error);
