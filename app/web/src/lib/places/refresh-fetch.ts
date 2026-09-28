import type { DetailsOutcome, DiscoverOutcome, LatLng, RefreshPort } from '@/lib/catalog/refresh';
import { currentLocale, resolveApiErrorMessage } from '@/lib/i18n';
import { en } from '@/lib/i18n/messages.en';
import { zh } from '@/lib/i18n/messages.zh';
import type {
  ImportPreview,
  RefreshDetailsResponse,
  RefreshDiscoverResponse,
  RefreshItemError,
} from './contract';

/**
 * `RefreshPort` 的真身：走我们自己的三个 Route Handler
 * （`/api/refresh/details`、`/api/refresh/discover`、`/api/explore/preview`）。
 *
 * 为什么刷新引擎要有这么一层而不是直接 fetch：
 *   - **密钥只在服务端**（ADR-0007），浏览器不可能直接调 Places；
 *   - 流水线（`catalog/refresh.ts`）因此只依赖一个注入的接口，单测塞假实现就行，
 *     **不打真网、不需要密钥**；
 *   - 文案本地化收在这一层：端口返回的 `error` 已经是**当前语言**的人话，
 *     流水线与报告里不再出现「翻译」这件事。
 *
 * 复用了 EXPLORE 的错误约定（design/0007 §4）：服务端优先给 `code`，
 * 客户端查字典，查不到才退回服务端自带的中文。
 */

/** 不是组件/hook，拿不到 `useT()`，按当前语言直接查字典（同 exploreClient） */
function tt(key: 'explore.error.network' | 'explore.error.badResponse' | 'explore.error.generic'): string {
  return currentLocale() === 'en' ? en[key] : zh[key];
}

function itemErrorText(err: RefreshItemError | undefined): string {
  if (!err) return tt('explore.error.generic');
  return resolveApiErrorMessage(err.code, err.message || tt('explore.error.generic'));
}

async function postJson<TRes>(url: string, body: unknown): Promise<TRes> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(tt('explore.error.network'));
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(tt('explore.error.badResponse'));
  }

  const maybeError = data as { error?: boolean; message?: string; code?: string };
  if (!res.ok || maybeError?.error) {
    throw new Error(resolveApiErrorMessage(
      maybeError?.code,
      maybeError?.message || tt('explore.error.generic'),
    ));
  }
  return data as TRes;
}

/**
 * 默认端口（浏览器里用）。
 *
 * 注意三个方法都**可能抛**（整批失败：断网、端点 500）。流水线接住之后会把
 * 每一家都记成一条 `RefreshFailure` —— 整批挂掉不等于「什么都没发生」。
 */
export function httpRefreshPort(initialProvider = 'google'): RefreshPort {
  // 服务端每次响应都带 `demo`（缺密钥时用 fixture）。台账要如实记「这条是
  // 真数据还是演示数据」，所以 providerName 跟着响应走，而不是写死 'google'。
  let provider = initialProvider;

  return {
    get providerName() {
      return provider;
    },

    async detailsBatch(placeIds: string[]): Promise<DetailsOutcome[]> {
      if (placeIds.length === 0) return [];
      const res = await postJson<RefreshDetailsResponse>('/api/refresh/details', { placeIds });
      provider = res.demo ? 'fixture' : 'google';
      return res.results.map((item) => ({
        placeId: item.placeId,
        ...(item.details ? { details: item.details } : { error: itemErrorText(item.error) }),
      }));
    },

    async discover(queries: string[], at: LatLng): Promise<DiscoverOutcome[]> {
      if (queries.length === 0) return [];
      const res = await postJson<RefreshDiscoverResponse>('/api/refresh/discover', {
        queries,
        bias: { lat: at.lat, lng: at.lng },
      });
      provider = res.demo ? 'fixture' : 'google';
      return res.results.map((item) => ({
        query: item.query,
        candidates: item.candidates ?? [],
        ...(item.error ? { error: itemErrorText(item.error) } : {}),
      }));
    },

    async preview(placeId: string): Promise<ImportPreview> {
      const res = await postJson<ImportPreview>('/api/explore/preview', { placeId });
      provider = res.demo ? 'fixture' : 'google';
      return res;
    },
  };
}
