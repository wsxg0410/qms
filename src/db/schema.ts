import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const QueueStatus = [
  'active',
  'hang',
  'doing',
  'done',
  'fail',
  'out_times',
] as const;

export type QueueStatusType = (typeof QueueStatus)[number];

export const QueueModal = sqliteTable(
  'queues',
  {
    id: text('id').primaryKey(),
    env: text('env').notNull(),
    type: text('type').notNull(),
    status: text('status', { enum: QueueStatus }).notNull().default(`active`),
    errorTimes: integer('errorTimes').notNull().default(0),
    data: text('data', { mode: 'json' }).$type<any>().default({}),
    config: text('config', { mode: 'json' }).$type<any>().default({}),
    priority: integer('priority').notNull().default(0),
    result: text('result'),

    execAt: text('execAt')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),

    createdAt: text('createdAt')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),

    updatedAt: text('updatedAt')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    idxQueuesExecAt: index('idx_execAt').on(table.execAt),
    idxQueuesCreatedAt: index('idx_createdAt').on(table.createdAt),
    idxQueuesEnvType: index('idx_env_type').on(table.env, table.type),
  }),
);

export type Queue = typeof QueueModal.$inferSelect;
