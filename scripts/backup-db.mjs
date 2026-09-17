/**
 * Backup SQLite sûr à chaud : VACUUM INTO vers /backups (ou BACKUP_DIR),
 * contrôle d'intégrité du fichier produit, rétention glissante.
 * Usage : node scripts/backup-db.mjs   (env : DB_PATH, BACKUP_DIR, BACKUP_RETENTION_DAYS)
 * Cron VPS : 0 3 * * * docker exec charbon-app-1 node scripts/backup-db.mjs
 */
import { readdirSync, statSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createClient } from '@libsql/client';

const dbPath = process.env.DB_PATH ?? 'data/charbon.db';
const backupDir = resolve(process.env.BACKUP_DIR ?? '/backups');
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 7);

mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = join(backupDir, `charbon-${stamp}.db`);

const client = createClient({ url: `file:${dbPath}` });
await client.execute('VACUUM INTO ' + `'${target}'`);
// Intégrité du backup produit
const check = createClient({ url: `file:${target}` });
const res = await check.execute('PRAGMA integrity_check');
const ok = res.rows[0]?.[0] === 'ok' || Object.values(res.rows[0] ?? {})[0] === 'ok';
if (!ok) {
  console.error('✗ backup CORROMPU :', target);
  process.exit(1);
}
await check.close();
await client.close();

// Rétention glissante
const now = Date.now();
for (const f of readdirSync(backupDir)) {
  if (!f.startsWith('charbon-') || !f.endsWith('.db')) continue;
  const p = join(backupDir, f);
  if (now - statSync(p).mtimeMs > retentionDays * 86_400_000) {
    unlinkSync(p);
    console.log('backup purgé :', f);
  }
}
console.log(`✓ backup OK : ${target} (${(statSync(target).size / 1024).toFixed(0)} Ko, intégrité vérifiée)`);
if (!existsSync(target)) process.exit(1);
