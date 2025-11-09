import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  lt,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { nanoid } from 'nanoid'; // 用于为非唯一任务生成ID

import { QueueModal, type Queue, type QueueStatusType } from '@/db/schema';
import type { GetQueueInput } from '@/dto/queue.dto';
import { chunk, md5 } from '@/lib/helper';
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
      // 这是一个原子操作，比“先查询再更新”更高效、更安全。
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
          });
      }

      return this.db.insert(QueueModal).values(row).onConflictDoNothing();
    });

    const ids = queuePayloads.map((item) => item.id);

    await this.db.batch(statements as any);

    const qes = await this.getByIds(ids);

    return qes;
  }

  async getByIds(ids: string[]) {
    const CHUNK_SIZE = 80;

    const promises = [];

    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const chunk = ids.slice(i, i + CHUNK_SIZE);

      if (chunk.length > 0) {
        const queryPromise = this.db
          .select()
          .from(QueueModal)
          .where(inArray(QueueModal.id, chunk)); // 只查询这个小 chunk

        promises.push(queryPromise);
      }
    }

    const resultsArray = await Promise.all(promises);

    const allQueues = resultsArray.flat();

    return allQueues;
  }

  /**
   * 根据 GetQueueInput 生成 where 条件
   */
  private async getCond(
    env: string,
    search: GetQueueInput,
  ): Promise<SQL | undefined> {
    const conds: SQL[] = [];
    conds.push(eq(QueueModal.env, env));

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
      whereCondition = inArray(QueueModal.id, ids);
    }
    // 否则，根据 search 对象构建查询条件
    else if (input) {
      whereCondition = await this.getCond(env, input);
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
        env,
        status: `active`,
        errorTimes: 0,
      })
      .where(whereCondition);

    return true;
  }

  /**
   * Gets the count of queues matching specific criteria.
   * @param params - The query parameters.
   * @param params.type - The queue type, supports regex.
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

          // Condition 2: Match the type using REGEXP
          sql`${QueueModal.type} regexp ${type}`,

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

  async remove(env: string, id: string) {
    await this.db
      .delete(QueueModal)
      .where(and(eq(QueueModal.id, id), eq(QueueModal.env, env)));
  }

  async updateStatus(
    env: string,
    id: string,
    status: QueueStatusType,
  ): Promise<Queue> {
    await this.db
      .update(QueueModal)
      .set({
        status,
      })
      .where(and(eq(QueueModal.id, id), eq(QueueModal.env, env)));

    const queue = await this.getById(id);
    if (!queue) throw new Error('Queue not found');

    if (queue?.env !== env) throw new Error('Invalid env');

    return queue;
  }

  async updateQueue(
    env: string,
    id: string,
    {
      result,
      status,
      errorTimes,
    }: { result: string; status: QueueStatusType; errorTimes: number },
  ) {
    await this.db
      .update(QueueModal)
      .set({ result, status, errorTimes })
      .where(and(eq(QueueModal.id, id), eq(QueueModal.env, env)));

    const queue = await this.getById(id);

    if (queue?.env !== env) throw new Error('Invalid env');

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
    let where = await this.getCond(env, input);

    await this.db.delete(QueueModal).where(where);

    return true;
  }
}
