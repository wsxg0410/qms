// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';

import { createApiResponse } from '@/lib/app';
import { AppError, ValidationError } from '@/lib/error';

export const errorMdl = defineMiddleware(async (context, next) => {
  try {
    return await next();
  } catch (err) {
    // 默认错误信息
    let statusCode = 500;
    let responseBody: any = {
      message: 'An unexpected internal server error occurred.',
    };

    console.error('💥 Error Caught in Middleware:', err);

    // --- 细粒度化处理开始 ---
    if (err instanceof AppError) {
      // 所有继承自 AppError 的业务错误都会被捕获到这里
      statusCode = err.httpStatusCode;
      responseBody.message = err.message;

      // 特别处理 ValidationError，附带字段信息
      if (err instanceof ValidationError && err.fields) {
        responseBody.errors = err.fields;
      }
    }
    // 你也可以在这里处理非 AppError 的特定JS原生错误，比如 SyntaxError
    // else if (err instanceof SyntaxError) { ... }
    else if (import.meta.env.DEV) {
      // 在开发模式下，对于未知错误，显示堆栈信息
      responseBody.stack = err instanceof Error ? err.stack : String(err);
    }

    // 统一返回 JSON 格式的错误响应

    return createApiResponse(responseBody, statusCode);
  }
});
