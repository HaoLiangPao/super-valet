import type { ApiError } from './contract';
import { ProviderError, ValidationError } from './errors';

/**
 * Route Handler 的公共外壳（ADR-0007）。
 *
 * 两条纪律，三个端点一视同仁：
 *   1. **所有错误都回 `ApiError` 形状**，`message` 是给用户看的中文；
 *   2. **上游错误、堆栈、密钥一律不出响应**，只进服务端日志。
 */

export function errorResponse(message: string, status: number): Response {
  const body: ApiError = { error: true, message };
  return Response.json(body, { status });
}

/** 把 handler 里抛出的任何东西收敛成 `ApiError` */
export async function withApiErrors(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ProviderError) {
      return errorResponse(err.userMessage, err.status);
    }
    // 没预料到的错误：日志里留全貌，响应里只给一句人话
    console.error('[explore] 未处理的错误', err);
    return errorResponse('服务器开小差了，稍后再试', 500);
  }
}

/** 解析 JSON body；非 JSON / 非对象一律 400 */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new ValidationError('请求格式不对');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ValidationError('请求格式不对');
  }
  return parsed as Record<string, unknown>;
}

export interface StringFieldRules {
  /** 出错时用的中文字段名，如「店名」 */
  label: string;
  maxChars: number;
  /** 超长时的提示语；不给就用通用文案 */
  tooLongMessage?: string;
}

export function requireString(
  body: Record<string, unknown>,
  field: string,
  rules: StringFieldRules,
): string {
  const raw = body[field];
  if (typeof raw !== 'string') throw new ValidationError(`请填写${rules.label}`);
  const value = raw.trim();
  if (value.length === 0) throw new ValidationError(`请填写${rules.label}`);
  if (value.length > rules.maxChars) {
    throw new ValidationError(
      rules.tooLongMessage ?? `${rules.label}太长了，最多 ${rules.maxChars} 个字`,
    );
  }
  return value;
}
