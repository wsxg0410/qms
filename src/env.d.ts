/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    env: string;
    db: import('drizzle-orm/d1').DrizzleD1Database;
  }
}

