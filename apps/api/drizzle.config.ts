import { defineConfig } from 'drizzle-kit';

// Les migrations SQL générées sont committées dans apps/api/drizzle/.
// Elles sont appliquées au démarrage du serveur (voir src/db/migrate.ts).
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
});
