// src/lib/errors.ts

/**
 * 基础应用错误类，所有业务相关的自定义错误都应继承此类
 * 它包含一个 httpStatusCode，方便上层直接使用
 */
export class AppError extends Error {
  public readonly httpStatusCode: number;

  constructor(message: string, httpStatusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.httpStatusCode = httpStatusCode;
    // 保持正确的堆栈跟踪
    Error.captureStackTrace(this, this.constructor);
  }
}

// --- 具体业务错误 ---

/**
 * 资源未找到错误
 * 例如：查询数据库中不存在的用户
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 验证失败错误
 * 例如：用户提交的表单数据不符合要求
 */
export class ValidationError extends AppError {
  // 可以携带更详细的字段错误信息
  public readonly fields?: Record<string, string>;

  constructor(
    message: string = 'Validation failed',
    fields?: Record<string, string>,
  ) {
    super(message, 400); // Bad Request
    this.fields = fields;
  }
}

/**
 * 认证失败错误
 * 例如：用户未登录或 Token 无效
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401); // Unauthorized
  }
}

/**
 * 权限不足错误
 * 例如：普通用户尝试访问管理员才能访问的资源
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 403); // Forbidden
  }
}
