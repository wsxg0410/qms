import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    accountId: `84a13e10596141072b507307ea899b49`,
    databaseId: `fc49e84e-c761-47ee-a2e4-de2143b6e9cd`,
    token: `wKYJnj9Hm4QZQLlzxI25I_A_Qk2dK0xULh9Xequ-`,
  },
});
