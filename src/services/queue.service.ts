import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  lt,
  type SQL,
} from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { nanoid } from 'nanoid'; // 用于为非唯一任务生成ID

import { QueueModal, type Queue, type QueueStatusType } from '@/db/schema';
import type { GetQueueInput, ListQueueInput } from '@/dto/queue.dto';
import { md5 } from '@/lib/helper';
import type { QueueOption } from '@/types/queue.type';
import { BaseService } from './base.service';

export class QueueService extends BaseService {
  constructor(db: DrizzleD1Database) {
    super(db);
  }

  /**
   *向队列中添加一个新任务
   * @param type 任务类型
   * @param data 任务所需的数据
   * @param options 任务选项，如是否唯一、优先级等
   */
  async add<T = unknown>(type: string, data: T, options: QueueOption<T>) {
    const { unique = true, genKeyData, env } = options;
    const priority = options?.priority || 0;
    const now = new Date().toISOString();

    // --- 1. 处理需要确保唯一的任务 ---
    if (unique) {
      // 根据任务内容生成一个唯一的ID
      const id = md5(
        JSON.stringify({
          env,
          type,
          data: genKeyData ? genKeyData(data) : data,
        }),
      );

      // 使用 Drizzle 的 "UPSERT" 功能:
      // 如果ID不存在，则插入新纪录；如果ID已存在，则更新指定字段。
      // 这是一个原子操作，比"先查询再更新"更高效、更安全。
      const result = await this.db
        .insert(QueueModal)
        .values({
          id,
          env,
          type,
          data,
          config: options,
          priority,
          execAt: now,
          status: 'active',
          errorTimes: 0, // 重新添加时重置错误次数
        })
        .onConflictDoUpdate({
          target: QueueModal.id, // 冲突目标是主键id
          set: {
            config: options,
            priority,
            execAt: now,
            status: 'active', // 将状态重置为 active
            errorTimes: 0, // 重置错误次数
            updatedAt: now,
          },
        })
        .returning();

      return result[0] ?? null;
    }

    // --- 2. 处理非唯一任务（每次调用都创建新任务） ---
    // 为新任务生成一个全新的、不重复的ID
    const id = nanoid();

    // 直接插入新纪录
    const result = await this.db
      .insert(QueueModal)
      .values({
        id,
        env,
        type,
        status: 'active',
        errorTimes: 0,
        data,
        config: options,
        priority,
        execAt: now,
      })
      .returning();

    return result[0] ?? null;
  }

  /**
   * 批量向队列中添加任务（已针对D1的变量限制进行优化）
   * @param type 任务类型
   * @param datas 任务数据数组
   * @param options 任务选项
   */
  async bulkAdd<T = any>(
    type: string,
    datas: T[],
    options: QueueOption<T>,
  ): Promise<Queue[]> {
    // 如果没有数据，直接返回
    if (!datas || datas.length === 0) {
      return [];
    }

    const { unique = true, priority = 0, genKeyData, env } = options;
    const now = new Date().toISOString();

    // 1. 准备所有要插入的数据
    // (已修复：确保 payloads 包含所有 NOT NULL 的字段)
    let queuePayloads = await Promise.all(
      datas.map(async (item: T) => {
        // 根据 unique 选项决定如何生成 id
        const id = unique
          ? md5(
              // 唯一任务：根据内容生成确定性ID
              JSON.stringify({
                env: env,
                type,
                data: genKeyData ? genKeyData(item) : item,
              }),
            )
          : nanoid(); // 非唯一任务：为每个任务生成一个全新的随机ID

        // 必须返回一个完整的 Insert Model
        return {
          id,
          env,
          type,
          data: item,
          config: options,
        };
      }),
    );

    const statements = queuePayloads.map((row) => {
      if (unique) {
        return this.db
          .insert(QueueModal)
          .values(row)
          .onConflictDoUpdate({
            target: QueueModal.id,
            set: {
              status: 'active',
              errorTimes: 0,
              config: options,
              execAt: now,
              priority,
              updatedAt: now,
              // 注意：这里没有更新 data 字段，这似乎是故意的
            },
          })
          .returning();
      }

      return this.db
        .insert(QueueModal)
        .values(row)
        .onConflictDoNothing()
        .returning();
    });

    const batchResults = await this.db.batch(statements as any);

    // 直接使用 batch 返回值，避免冗余的 getByIds 回查
    return (batchResults as any[]).flat().filter(Boolean) as Queue[];
  }

  /**
   * 根据 GetQueueInput 生成 where 条件
   * env 作为可选筛选条件
   */
  private async getCond(
    search: GetQueueInput & { env?: string },
  ): Promise<SQL | undefined> {
    const conds: SQL[] = [];

    if (search.env) {
      conds.push(eq(QueueModal.env, search.env));
    }

    if (search.id) {
      conds.push(eq(QueueModal.id, search.id));
    }

    if (search.type) {
      conds.push(eq(QueueModal.type, search.type));
    }

    if (search.status) {
      conds.push(eq(QueueModal.status, search.status));
    }

    if (conds.length === 0) return undefined;
    if (conds.length === 1) return conds[0];

    return and(...(conds as any));
  }

  async reactive(env: string, input: GetQueueInput): Promise<boolean> {
    const { ids } = input;

    let whereCondition: SQL | undefined;

    // 优先根据 ids 数组构建查询条件
    if (ids && ids.length > 0) {
      whereCondition = and(
        eq(QueueModal.env, env),
        inArray(QueueModal.id, ids),
      );
    }
    // 否则，根据 search 对象构建查询条件
    else if (input) {
      whereCondition = await this.getCond({ ...input, env });
    }

    // 如果没有任何查询条件，则直接返回，避免更新整个表
    if (!whereCondition) {
      console.warn(
        'Reactive called without any valid conditions, no rows updated.',
      );
      return false;
    }

    // 执行统一的更新操作
    await this.db
      .update(QueueModal)
      .set({
        status: `active`,
        errorTimes: 0,
        updatedAt: new Date().toISOString(),
      })
      .where(whereCondition);

    return true;
  }

  /**
   * Gets the count of queues matching specific criteria.
   * @param params - The query parameters.
   * @param params.type - The queue type, supports LIKE prefix match.
   * @param params.env - The environment to filter by.
   * @returns The number of matching queues.
   */
  async getActiveCount(params: { type: string; env: string }): Promise<number> {
    const { type, env } = params;

    const result = await this.db
      .select({
        value: count(),
      })
      .from(QueueModal)
      .where(
        and(
          // Condition 1: Match the environment
          eq(QueueModal.env, env),

          // Condition 2: Match the type using LIKE prefix match (可利用索引)
          like(QueueModal.type, `${type}%`),

          // Condition 3: Status must be in the specified list
          inArray(QueueModal.status, [`active`, `fail`]),
        ),
      );

    // Drizzle's count returns an array like [{ value: 123 }]
    return result[0]?.value ?? 0;
  }

  /**
   * Fetches a batch of queues that are ready to be processed.
   * @param params - The query parameters.
   * @param params.env - The environment to filter by.
   * @param params.type - The queue type to filter by.
   * @param params.batchSize - The maximum number of queues to return.
   * @returns A promise that resolves to an array of queue items.
   */
  async getByBatchSize({
    env,
    type,
    batchSize = 100,
  }: {
    env: string;
    type: string;
    batchSize?: number;
  }): Promise<Queue[]> {
    // Using ISO string format for correct textual comparison with dates in the database
    const now = new Date().toISOString();

    const queues = await this.db
      .select()
      .from(QueueModal)
      .where(
        and(
          eq(QueueModal.env, env),
          eq(QueueModal.type, type),
          inArray(QueueModal.status, [`active`, `fail`]),
          lt(QueueModal.execAt, now),
        ),
      )
      .orderBy(desc(QueueModal.priority), asc(QueueModal.updatedAt))
      .limit(batchSize);

    return queues;
  }

  /**
   * 按 id 删除单条记录
   */
  async removeById(id: string) {
    await this.db
      .delete(QueueModal)
      .where(eq(QueueModal.id, id));
  }

  /**
   * 按 id 数组批量删除
   */
  async removeByIds(ids: string[]) {
    if (!ids || ids.length === 0) return;
    await this.db
      .delete(QueueModal)
      .where(inArray(QueueModal.id, ids));
  }

  /**
   * 按 env + id 删除（内部调用者使用）
   */
  async remove(env: string, id: string) {
    await this.db
      .delete(QueueModal)
      .where(and(eq(QueueModal.id, id), eq(QueueModal.env, env)));
  }

  async updateStatus(
    id: string,
    status: QueueStatusType,
  ): Promise<Queue> {
    const [queue] = await this.db
      .update(QueueModal)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(QueueModal.id, id))
      .returning();

    if (!queue) throw new Error('Queue not found');

    return queue;
  }

  async updateQueue(
    id: string,
    {
      result,
      status,
      errorTimes,
    }: { result: string; status: QueueStatusType; errorTimes: number },
  ) {
    const [queue] = await this.db
      .update(QueueModal)
      .set({
        result,
        status,
        errorTimes,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(QueueModal.id, id))
      .returning();

    if (!queue) throw new Error('Queue not found');

    return queue;
  }

  async getById(id: string) {
    return await this.db
      .select()
      .from(QueueModal)
      .where(eq(QueueModal.id, id))
      .limit(1)
      .get();
  }

  async removeAll(env: string, input: GetQueueInput = {}) {
    let where = await this.getCond({ ...input, env });

    await this.db.delete(QueueModal).where(where);

    return true;
  }

  /**
   * 分页查询任务列表
   * env 是可选筛选条件，与 type、status 同级
   */
  async list(
    input: ListQueueInput & { env?: string },
  ): Promise<{ data: Queue[]; total: number; page: number; pageSize: number }> {
    const { env, type, status, resultKeyword, page = 1, pageSize = 20 } = input;
    const offset = (page - 1) * pageSize;

    const conds: SQL[] = [];

    if (env) {
      conds.push(eq(QueueModal.env, env));
    }

    if (type) {
      conds.push(eq(QueueModal.type, type));
    }

    if (status) {
      conds.push(eq(QueueModal.status, status));
    }

    if (resultKeyword) {
      conds.push(like(QueueModal.result, `%${resultKeyword}%`));
    }

    const whereClause = conds.length === 0
      ? undefined
      : conds.length === 1
        ? conds[0]
        : and(...(conds as any));

    // 并行获取数据和总数
    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(QueueModal)
        .where(whereClause)
        .orderBy(desc(QueueModal.createdAt))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ value: count() })
        .from(QueueModal)
        .where(whereClause),
    ]);

    return {
      data,
      total: totalResult[0]?.value ?? 0,
      page,
      pageSize,
    };
  }

  /**
   * 批量更新任务状态（按 id 数组）
   */
  async batchUpdateStatus(
    ids: string[],
    status: QueueStatusType,
  ): Promise<number> {
    if (!ids || ids.length === 0) return 0;

    const result = await this.db
      .update(QueueModal)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(inArray(QueueModal.id, ids))
      .returning();

    return result.length;
  }

  /**
   * 获取各状态的任务统计概览
   * env 是可选筛选条件
   */
  async getStats(
    env?: string,
    type?: string,
  ): Promise<{ status: string; count: number }[]> {
    const conds: SQL[] = [];

    if (env) {
      conds.push(eq(QueueModal.env, env));
    }

    if (type) {
      conds.push(eq(QueueModal.type, type));
    }

    const whereClause = conds.length === 0
      ? undefined
      : conds.length === 1
        ? conds[0]
        : and(...(conds as any));

    const result = await this.db
      .select({
        status: QueueModal.status,
        count: count(),
      })
      .from(QueueModal)
      .where(whereClause)
      .groupBy(QueueModal.status);

    return result.map((r) => ({
      status: r.status,
      count: r.count,
    }));
  }

  /**
   * 获取所有不同的 env 值（用于筛选下拉）
   */
  async getDistinctEnvs(): Promise<string[]> {
    const result = await this.db
      .selectDistinct({ env: QueueModal.env })
      .from(QueueModal)
      .orderBy(asc(QueueModal.env));

    return result.map((r) => r.env);
  }

  /**
   * 获取不同的 type 值（用于筛选下拉），可按 env 过滤
   * 走 idx_env_type 复合索引，查询成本极低
   */
  async getDistinctTypes(env?: string): Promise<string[]> {
    const query = this.db
      .selectDistinct({ type: QueueModal.type })
      .from(QueueModal);

    const result = env
      ? await query.where(eq(QueueModal.env, env)).orderBy(asc(QueueModal.type))
      : await query.orderBy(asc(QueueModal.type));

    return result.map((r) => r.type);
  }
}
