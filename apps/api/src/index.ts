/**
 * Point d'entrée du serveur Charbon.
 * Démarrage : .env → config validée → DB migrée → app → écoute → ordonnanceur
 * de rappels. Arrêt propre sur SIGINT/SIGTERM.
 */
import { buildApp } from './app.js';
import { loadConfig, loadDotEnv } from './config/env.js';
import { startReminderScheduler } from './services/reminder-scheduler.js';

async function main(): Promise<void> {
  loadDotEnv();
  const config = loadConfig();
  const built = await buildApp({ config, logger: true });

  if (config.nodeEnv !== 'test') {
    startReminderScheduler(built.dbHandle.db);
  }

  await built.app.listen({ port: config.port, host: config.host });

  built.app.log.info(
    {
      env: config.nodeEnv,
      url: `http://${config.host}:${config.port}`,
      app: `http://${config.host}:${config.port}/app/`,
      mailer: built.mailerMode,
      devBilling: config.devBilling,
    },
    'Charbon API démarrée',
  );

  const shutdown = async (signal: string) => {
    built.app.log.info({ signal }, 'Arrêt en cours…');
    try {
      await built.close();
      process.exit(0);
    } catch (err) {
      built.app.log.error({ err }, 'Erreur pendant l’arrêt');
      process.exit(1);
    }
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[charbon-api] démarrage impossible :', err);
  process.exit(1);
});
