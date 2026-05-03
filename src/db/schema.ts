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
    // 核心复合索引 — 完整覆盖 getByBatchSize 的 WHERE 条件
    idxBatchQuery: index('idx_env_type_status_execAt').on(
      table.env,
      table.type,
      table.status,
      table.execAt,
    ),
    // 环境+状态索引 — 覆盖 reactive(env, status) 和 getActiveCount
    idxEnvStatus: index('idx_env_status').on(table.env, table.status),
    // 环境+类型索引 — 覆盖 getCond 等通用查询
    idxQueuesEnvType: index('idx_env_type').on(table.env, table.type),
  }),
);

export type Queue = typeof QueueModal.$inferSelect;
