/**
 * 服务端错误的统一出口。
 *
 * 纪律（ADR-0007 §2）：**上游的原始错误、请求 URL、密钥一律不出现在响应里。**
 * 真实原因只写进服务端日志；返回给浏览器的永远是 `ApiError` 形状 +
 * 一句给用户看的中文。上游 4xx 的 body 里常带回显的 key 片段，
 * 一次疏忽的 `message: err.message` 就是一次密钥泄漏。
 */
export class ProviderError extends Error {
  /** 给用户看的中文 */
  readonly userMessage: string;
  /** 回给浏览器的 HTTP 状态 */
  readonly status: number;

  constructor(userMessage: string, options: { status?: number; cause?: unknown } = {}) {
    super(userMessage, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ProviderError';
    this.userMessage = userMessage;
    this.status = options.status ?? 502;
  }
}

/** 入参校验失败（400）；message 直接给用户看 */
export class ValidationError extends ProviderError {
  constructor(userMessage: string) {
    super(userMessage, { status: 400 });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ProviderError {
  constructor(userMessage: string) {
    super(userMessage, { status: 404 });
    this.name = 'NotFoundError';
  }
}
