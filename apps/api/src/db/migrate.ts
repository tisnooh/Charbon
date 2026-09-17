/**
 * Application des migrations SQL générées (apps/api/drizzle/).
 * Idempotent : drizzle tient un journal interne (__drizzle_migrations).
 * En production, le dossier migrations est copié dans dist (voir tsconfig/package).
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { sql } from 'drizzle-orm';
import type { Db } from './client.js';

const here = dirname(fileURLToPath(import.meta.url));

export function migrationsFolder(): string {
  // Dev (tsx, src/db) → apps/api/drizzle ; Build (dist/db) → apps/api/drizzle.
  const candidates = [resolve(here, '../../drizzle'), resolve(here, '../../../drizzle')];
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error(`Dossier de migrations introuvable (essayé : ${candidates.join(', ')})`);
}

export async function runMigrations(db: Db): Promise<void> {
  await migrate(db, { migrationsFolder: migrationsFolder() });
  // PRAGMA par connexion : intégrité référentielle stricte (cascades de suppression).
  await db.run(sql`PRAGMA foreign_keys = ON`);
}
