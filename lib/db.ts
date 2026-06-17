import { neon } from "@neondatabase/serverless";

let schemaReady = false;

export function hasDb() {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function getSql() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  return neon(url);
}

export async function ensureSchema() {
  if (schemaReady || !hasDb()) return hasDb();
  const sql = getSql();
  if (!sql) return false;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      hashed_password TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS household_profiles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT DEFAULT 'Evim',
      devices_json TEXT NOT NULL DEFAULT '[]',
      applied_recos_json TEXT NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`;
  schemaReady = true;
  return true;
}

export { getSql };
