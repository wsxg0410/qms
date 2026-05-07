import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';

import { QueueStatus, type QueueStatusType } from '@/db/schema';
import { QueueService } from '@/services/queue.service';

import { verifyAuthKey } from './auth.guard';

/** 创建已认证的 QueueService 实例 */
function getService(request: Request) {
  verifyAuthKey(request);
  const db = drizzle(env.DB);
  return new QueueService(db);
}

export const queue = {
  /**
   * 分页列表 — 对应 react-admin getList
   * env 是普通筛选字段，可选
   */
  getList: defineAction({
    input: z.object({
      env: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      resultKeyword: z.string().optional(),
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      sortField: z.string().default('createdAt'),
      sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      const result = await svc.list({
        env: input.env,
        type: input.type,
        status: input.status as QueueStatusType | undefined,
        resultKeyword: input.resultKeyword,
        page: input.page,
        pageSize: input.pageSize,
      });
      return result;
    },
  }),

  /**
   * 获取单条记录 — 对应 react-admin getOne
   */
  getOne: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      const queue = await svc.getById(input.id);
      if (!queue) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: `Queue ${input.id} not found`,
        });
      }
      return queue;
    },
  }),

  /**
   * 按 ID 数组获取多条 — 对应 react-admin getMany
   */
  getMany: defineAction({
    input: z.object({
      ids: z.array(z.string()),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      const results = await svc.getByIds(input.ids);
      return results;
    },
  }),

  /**
   * 更新单条记录 — 对应 react-admin update
   */
  update: defineAction({
    input: z.object({
      id: z.string(),
      status: z.enum(QueueStatus).optional(),
      result: z.string().optional(),
      errorTimes: z.number().optional(),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);

      if (
        input.status !== undefined &&
        input.result !== undefined &&
        input.errorTimes !== undefined
      ) {
        return svc.updateQueue(input.id, {
          status: input.status,
          result: input.result,
          errorTimes: input.errorTimes,
        });
      }

      if (input.status !== undefined) {
        return svc.updateStatus(input.id, input.status);
      }

      throw new ActionError({
        code: 'BAD_REQUEST',
        message: 'At least status is required for update',
      });
    },
  }),

  /**
   * 批量更新状态 — 对应 react-admin updateMany
   */
  updateMany: defineAction({
    input: z.object({
      ids: z.array(z.string()).min(1),
      status: z.enum(QueueStatus),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      const count = await svc.batchUpdateStatus(
        input.ids,
        input.status,
      );
      return { updatedCount: count };
    },
  }),

  /**
   * 删除单条 — 对应 react-admin delete
   */
  delete: defineAction({
    input: z.object({
      id: z.string(),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      await svc.removeById(input.id);
      return { id: input.id };
    },
  }),

  /**
   * 批量删除 — 对应 react-admin deleteMany
   */
  deleteMany: defineAction({
    input: z.object({
      ids: z.array(z.string()).min(1),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      await svc.removeByIds(input.ids);
      return { ids: input.ids };
    },
  }),

  /**
   * 统计概览 — Dashboard 使用
   * 不按 env 过滤，统计全局数据
   */
  getStats: defineAction({
    input: z.object({
      env: z.string().optional(),
      type: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      return svc.getStats(input.env, input.type);
    },
  }),

  /**
   * 获取所有不同的 env 值（筛选下拉用）
   */
  getEnvOptions: defineAction({
    handler: async (_input, ctx) => {
      const svc = getService(ctx.request);
      return svc.getDistinctEnvs();
    },
  }),

  /**
   * 获取不同的 type 值（筛选下拉用），可按 env 过滤
   */
  getTypeOptions: defineAction({
    input: z.object({
      env: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      return svc.getDistinctTypes(input.env);
    },
  }),

  /**
   * 按筛选条件获取匹配记录数（用于批量操作前确认）
   */
  countByFilter: defineAction({
    input: z.object({
      env: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      resultKeyword: z.string().optional(),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      const count = await svc.countByFilter({
        env: input.env || undefined,
        type: input.type || undefined,
        status: input.status || undefined,
        resultKeyword: input.resultKeyword || undefined,
      });
      return { count };
    },
  }),

  /**
   * 按筛选条件执行批量操作（删除 / 更新状态）
   * 不依赖 ids 数组，直接在数据库层面按条件执行
   */
  bulkActionByFilter: defineAction({
    input: z.object({
      env: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      resultKeyword: z.string().optional(),
      action: z.enum(['delete', 'setActive', 'setDone', 'setHang']),
    }),
    handler: async (input, ctx) => {
      const svc = getService(ctx.request);
      const filter = {
        env: input.env || undefined,
        type: input.type || undefined,
        status: input.status || undefined,
        resultKeyword: input.resultKeyword || undefined,
      };

      let affected = 0;
      switch (input.action) {
        case 'delete':
          affected = await svc.removeByFilter(filter);
          break;
        case 'setActive':
          affected = await svc.updateStatusByFilter(filter, 'active');
          break;
        case 'setDone':
          affected = await svc.updateStatusByFilter(filter, 'done');
          break;
        case 'setHang':
          affected = await svc.updateStatusByFilter(filter, 'hang');
          break;
      }

      return { affected, action: input.action };
    },
  }),
};

