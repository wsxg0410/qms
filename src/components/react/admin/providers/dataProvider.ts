import type { DataProvider } from 'react-admin';
import { unflatten } from 'devalue';

import { getAuthKey } from './authProvider';

const ENV_STORAGE = 'qms-admin-env';

/** 获取当前选中的环境（namespace） */
export function getAdminEnv(): string {
  return localStorage.getItem(ENV_STORAGE) || 'dev';
}

/** 设置当前环境 */
export function setAdminEnv(env: string): void {
  localStorage.setItem(ENV_STORAGE, env);
}

/**
 * 调用 Astro Action
 * Astro Actions 返回 application/json+devalue 格式，需要用 devalue 的 unflatten 解析
 */
async function callAction<T = any>(
  actionName: string,
  input: Record<string, any>,
): Promise<T> {
  const authKey = getAuthKey();

  const res = await fetch(`/_actions/${actionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authKey ? { 'x-auth-key': authKey } : {}),
    },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  let parsed: any;
  if (contentType.includes('json+devalue')) {
    // Astro Actions devalue 格式：先 JSON.parse 得到 flat 数组，再 unflatten 还原
    const flat = JSON.parse(text);
    parsed = unflatten(flat);
  } else {
    parsed = JSON.parse(text);
  }

  if (!res.ok) {
    const error: any = new Error(parsed?.message || `Action ${actionName} failed`);
    error.status = res.status;
    throw error;
  }

  return parsed as T;
}

/**
 * react-admin DataProvider
 * 将 CRUD 操作映射为 Astro Actions 调用
 */
export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 };
    const { field, order } = params.sort || {
      field: 'createdAt',
      order: 'DESC',
    };
    const filter = params.filter || {};

    const result = await callAction('queue.getList', {
      env: filter.env || getAdminEnv(),
      type: filter.type || undefined,
      status: filter.status || undefined,
      page,
      pageSize: perPage,
      sortField: field,
      sortOrder: order,
    });

    return {
      data: result.data,
      total: result.total,
    };
  },

  getOne: async (_resource, params) => {
    const data = await callAction('queue.getOne', {
      id: String(params.id),
    });
    return { data };
  },

  getMany: async (_resource, params) => {
    const data = await callAction('queue.getMany', {
      ids: params.ids.map(String),
    });
    return { data };
  },

  getManyReference: async (_resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 20 };
    const result = await callAction('queue.getList', {
      env: getAdminEnv(),
      page,
      pageSize: perPage,
    });
    return { data: result.data, total: result.total };
  },

  create: async (_resource, _params) => {
    throw new Error('Create is not supported from admin panel');
  },

  update: async (_resource, params) => {
    const { id, data: updateData } = params;
    const result = await callAction('queue.update', {
      id: String(id),
      env: updateData.env || getAdminEnv(),
      status: updateData.status,
      result: updateData.result,
      errorTimes: updateData.errorTimes,
    });
    return { data: result };
  },

  updateMany: async (_resource, params) => {
    const { ids, data: updateData } = params;
    await callAction('queue.updateMany', {
      ids: ids.map(String),
      env: updateData.env || getAdminEnv(),
      status: updateData.status,
    });
    return { data: ids };
  },

  delete: async (_resource, params) => {
    await callAction('queue.delete', {
      id: String(params.id),
      env: (params.previousData as any)?.env || getAdminEnv(),
    });
    return { data: params.previousData as any };
  },

  deleteMany: async (_resource, params) => {
    await callAction('queue.deleteMany', {
      ids: params.ids.map(String),
      env: getAdminEnv(),
    });
    return { data: params.ids };
  },
};
