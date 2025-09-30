/// <reference types="astro/client" />
type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {
    env: string;
    db: import('drizzle-orm/d1').DrizzleD1Database;
    user?: {
      username: string;
    };
  }
}
