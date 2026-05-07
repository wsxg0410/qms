import { unflatten } from 'devalue';

import { getAuthKey } from '../providers/authProvider';

/**
 * 调用 Astro Action 的通用工具
 * Astro Actions 返回 application/json+devalue 格式，需要用 devalue 的 unflatten 解析
 */
export async function fetchAction<T = any>(
  actionName: string,
  input: Record<string, any> = {},
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
    const flat = JSON.parse(text);
    parsed = unflatten(flat);
  } else {
    parsed = JSON.parse(text);
  }

  if (!res.ok) {
    const error: any = new Error(
      parsed?.message || `Action ${actionName} failed`,
    );
    error.status = res.status;
    throw error;
  }

  return parsed as T;
}
