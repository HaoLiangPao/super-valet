/**
 * 服务端错误的统一出口。
 *
 * 纪律（ADR-0007 §2）：**上游的原始错误、请求 URL、密钥一律不出现在响应里。**
 * 真实原因只写进服务端日志；返回给浏览器的永远是 `ApiError` 形状 +
 * 一句给用户看的中文。上游 4xx 的 body 里常带回显的 key 片段，
 * 一次疏忽的 `message: err.message` 就是一次密钥泄漏。
 *
 * i18n（design/0007 §4）：`code` 是可选的机读错误码，客户端优先用它查字典，
 * 查不到才退回这里的中文 `userMessage`。`code` 是可写字段（不是 readonly）——
 * `route.ts` 里包一层上游调用，把「哪条上游服务出的错」这个只有调用方才知道
 * 的上下文（是 Places 还是 LLM）事后补上去，不用改 google.ts/openrouter.ts
 * 这些不在本轮改动范围内的 provider 实现。
 */
export type ErrorCode =
  | 'places.not_found'
  | 'places.upstream'
  | 'llm.unavailable'
  | 'validation.required'
  | 'validation.too_long'
  | 'validation.invalid';

export class ProviderError extends Error {
  /** 给用户看的中文，客户端查不到 code 对应的字典项时的兜底 */
  readonly userMessage: string;
  /** 回给浏览器的 HTTP 状态 */
  readonly status: number;
  /** 机读错误码；未设置时客户端直接显示 `userMessage` */
  code?: ErrorCode;

  constructor(
    userMessage: string,
    options: { status?: number; cause?: unknown; code?: ErrorCode } = {},
  ) {
    super(userMessage, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = 'ProviderError';
    this.userMessage = userMessage;
    this.status = options.status ?? 502;
    if (options.code) this.code = options.code;
  }
}

/** 入参校验失败（400）；message 直接给用户看；默认 code 兜底为「格式不对」 */
export class ValidationError extends ProviderError {
  constructor(userMessage: string, code: ErrorCode = 'validation.invalid') {
    super(userMessage, { status: 400, code });
    this.name = 'ValidationError';
  }
}

/** 目前站内所有 NotFoundError 都是「这家店没查到」，默认 code 固定为 places.not_found */
export class NotFoundError extends ProviderError {
  constructor(userMessage: string) {
    super(userMessage, { status: 404, code: 'places.not_found' });
    this.name = 'NotFoundError';
  }
}

/**
 * 给上游调用补一个兜底 code：只在错误还没有 code 时才设置，
 * 不覆盖更具体的分类（比如 `NotFoundError` 已经带了 `places.not_found`）。
 * 用在 route.ts 里包一层 `places.search()` / `analyzer.classify()` 这类调用——
 * 这里才知道「这次调的是地图服务还是 LLM」，google.ts/openrouter.ts 本身不需要改。
 */
export function tagUpstreamCode<T>(promise: Promise<T>, code: ErrorCode): Promise<T> {
  return promise.catch((err: unknown) => {
    if (err instanceof ProviderError && !err.code) err.code = code;
    throw err;
  });
}
