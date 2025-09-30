import fs from 'node:fs';
import dotenv from 'dotenv';

// Resolve which .env file to load based on ENV_FILE or NODE_ENV
function resolveEnvPath(): string | undefined {
  const explicit = process.env.ENV_FILE;
  if (explicit && fs.existsSync(explicit)) return explicit;

  const env = process.env.NODE_ENV || 'development';
  const candidates = [`.env.${env}.local`, `.env.${env}`, `.env.local`, `.env`];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

const envPath = resolveEnvPath();

if (envPath) {
  dotenv.config({ path: envPath });
  console.log(`[env] loaded ${envPath}`);
} else {
  dotenv.config();
  console.log('[env] loaded default process env');
}

if (!process.env.APP_NAME) {
  console.error('APP_NAME is not set');
  process.exit(1);
}

const cfg = {
  $schema: 'node_modules/wrangler/config-schema.json',
  name: process.env?.APP_NAME || `qms`,
  main: './dist/_worker.js/index.js',
  compatibility_date: '2025-08-20',
  compatibility_flags: ['nodejs_compat', 'global_fetch_strictly_public'],
  assets: { binding: 'ASSETS', directory: './dist' },
  observability: { enabled: true },
  d1_databases: [
    {
      binding: 'DB',
      database_name: process.env.D1_DATABASE_NAME,
      database_id: process.env.D1_DATABASE_ID,
      migrations_dir: 'drizzle/migrations',
    },
  ],
};

fs.writeFileSync('wrangler.jsonc', JSON.stringify(cfg, null, 2));
