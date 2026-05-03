import fs from 'node:fs';
import dotenv from 'dotenv';

// --- 覆盖式加载 ---
// 1. 先加载 .env 作为基础
// 2. 再加载 .env.{NODE_ENV} 覆盖（如 .env.production）
function loadEnvWithOverride(): void {
  // 基础层：始终加载 .env
  if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env', override: false });
    console.log('[env] base: .env');
  }

  // 覆盖层：按 NODE_ENV 加载环境特定文件
  const nodeEnv = process.env.NODE_ENV || 'development';
  const overridePath = `.env.${nodeEnv}`;
  if (fs.existsSync(overridePath) && fs.statSync(overridePath).size > 0) {
    dotenv.config({ path: overridePath, override: true });
    console.log(`[env] override: ${overridePath}`);
  }
}

loadEnvWithOverride();

if (!process.env.APP_NAME) {
  console.error('APP_NAME is not set');
  process.exit(1);
}

const cfg = {
  $schema: 'node_modules/wrangler/config-schema.json',
  name: process.env?.APP_NAME || `qms`,
  main: '@astrojs/cloudflare/entrypoints/server',
  compatibility_date: '2025-08-20',
  compatibility_flags: ['nodejs_compat'],
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

// --- 自动生成 .dev.vars（Cloudflare dev secrets） ---
// 将 .env 中非 bindings 配置的自定义变量写入 .dev.vars，供 wrangler dev / astro dev 使用
const BINDING_KEYS = new Set([
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'APP_NAME',
  'D1_DATABASE_NAME',
  'D1_DATABASE_ID',
  'NODE_ENV',
]);

const devVarsLines: string[] = [];
for (const [key, value] of Object.entries(process.env)) {
  if (!BINDING_KEYS.has(key) && key.startsWith('ADMIN_')) {
    devVarsLines.push(`${key}=${value}`);
  }
}

if (devVarsLines.length > 0) {
  fs.writeFileSync('.dev.vars', devVarsLines.join('\n') + '\n');
}
