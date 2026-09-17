/**
 * Client base de données : libSQL (fichier SQLite local) + Drizzle.
 * Choix : zéro service externe, binaire précompilé distribué par npm
 * (pas de compilateur requis). Migration vers Postgres possible plus tard
 * (couche repository + migrations SQL — voir docs/ARCHITECTURE.md).
 */
import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import * as schema from './schema.js';

export type Db = LibSQLDatabase<typeof schema>;

export interface DbHandle {
  client: Client;
  db: Db;
}

export function createDb(dbPath: string): DbHandle {
  if (dbPath !== ':memory:') {
    mkdirSync(dirname(dbPath), { recursive: true });
  }
  const client = createClient({ url: dbPath.startsWith('file:') ? dbPath : `file:${dbPath}` });
  const db = drizzle(client, { schema });
  return { client, db };
}
