import { DrizzleD1Database } from 'drizzle-orm/d1';

export class BaseService {
  protected db: DrizzleD1Database;

  constructor(db: DrizzleD1Database) {
    this.db = db;
  }
}
