import { ANCHORS } from '@/data/seed-restaurants';
import { OpenRouterNoteAnalyzer } from '@/lib/notes/openrouter';
import { FixtureNoteAnalyzer } from '@/lib/notes/fixture';
import type { NoteAnalyzer, PlaceProvider } from './contract';
import { FixturePlaceProvider } from './fixture';
import { GooglePlaceProvider } from './google';

/**
 * Provider 工厂（ADR-0007 §2/§3）。
 *
 * 只在服务端调用。两个密钥各管各的：**缺谁回落谁**，
 * 所以「有 Places 没 LLM」这种半吊子配置也能跑 ——
 * 搜索是真的，分类是演示的，响应里的 `demo` 会分别如实反映。
 *
 * 密钥名刻意不带 `NEXT_PUBLIC_` 前缀：带了就会被打进浏览器 bundle。
 */

export const PLACES_KEY_ENV = 'GOOGLE_PLACES_API_KEY';
export const LLM_KEY_ENV = 'OPENROUTER_API_KEY';
/** 换模型不用改代码；默认 DeepSeek（Hao 2026-09-25 指定） */
export const LLM_MODEL_ENV = 'OPENROUTER_MODEL';

/** 距离锚点：Downtown Markham（ADR-0003 的既定做法） */
export const IMPORT_ANCHOR = {
  lat: ANCHORS.downtownMarkham.lat,
  lng: ANCHORS.downtownMarkham.lng,
};

export interface ProviderBundle {
  places: PlaceProvider;
  analyzer: NoteAnalyzer;
  /** true = 地点数据来自 fixture */
  placesDemo: boolean;
  /** true = 抽取/分类来自 fixture */
  analyzerDemo: boolean;
}

function trimmed(value: string | undefined): string | null {
  const v = value?.trim();
  return v ? v : null;
}

export function resolveProviders(
  env: Record<string, string | undefined> = process.env,
): ProviderBundle {
  const placesKey = trimmed(env[PLACES_KEY_ENV]);
  const llmKey = trimmed(env[LLM_KEY_ENV]);
  const llmModel = trimmed(env[LLM_MODEL_ENV]);

  return {
    places: placesKey
      ? new GooglePlaceProvider({ apiKey: placesKey, bias: IMPORT_ANCHOR })
      : new FixturePlaceProvider(),
    analyzer: llmKey
      ? new OpenRouterNoteAnalyzer({ apiKey: llmKey, ...(llmModel ? { model: llmModel } : {}) })
      : new FixtureNoteAnalyzer(),
    placesDemo: placesKey === null,
    analyzerDemo: llmKey === null,
  };
}
