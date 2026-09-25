/**
 * EXPLORE 导入流水线的接口契约（design/0005 §4、ADR-0007）。
 *
 * 这个文件由创始人冻结，前端与服务端两侧都照它实现，**不要单方面改动**：
 * 要改先改 design/0005，再同步这里。
 *
 * 最重要的一条约束（design/0005 §4.2）：
 *   事实字段（坐标 / 营业时间 / 评分 / 价位 / placeId）**只能来自 PlaceProvider**，
 *   LLM 一律不得生成或补全 —— 推荐一家关着门的店是最伤信任的错误。
 *   NoteAnalyzer 只负责「把散文变成搜索词」和「把事实映射到我们的分类表」。
 */

import type { ServiceWindow } from '@/data/seed-restaurants';
import type { Restaurant, Slot } from '@/lib/engine/types';

// ── 1. Places：搜索候选 ────────────────────────────────────────────────

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  /** Places 给的粗类型，用于规则映射先行（design/0002 §8 Step 1） */
  primaryType?: string;
  rating?: number;
  ratingCount?: number;
}

// ── 2. Places：详情（全部是事实字段）──────────────────────────────────

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  priceLevel: number | null;
  rating: number;
  ratingCount: number;
  /** 已从 Places 的 regularOpeningHours 转换；跨零点用 '26:00' 表示次日 2:00 */
  serviceWindows: ServiceWindow[];
  closedDays: number[];
  dineIn: boolean;
  primaryType?: string;
  /** 最多 5 条，喂给分类器与菜品抽取；不落库原文之外的加工 */
  reviewSnippets?: string[];
  editorialSummary?: string;
}

export interface PlaceProvider {
  search(query: string, bias?: { lat: number; lng: number }): Promise<PlaceCandidate[]>;
  details(placeId: string): Promise<PlaceDetails>;
}

// ── 3. LLM：笔记抽取与菜系分类 ────────────────────────────────────────

export interface DishMention {
  name: string;
  /** 原文摘录，用于日后展示与溯源 */
  quote?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface NoteExtraction {
  /** 可直接丢给 PlaceProvider.search 的查询串，已含城市线索 */
  queries: string[];
  dishes: DishMention[];
}

export interface ClassifyInput {
  name: string;
  primaryType?: string;
  editorialSummary?: string;
  reviewSnippets?: string[];
}

export interface Classification {
  /** design/0002 的 subCuisine code，例如 CN_SICHUAN */
  primary: string;
  tags: string[];
  soloFriendly: boolean;
  slotLock: Slot[];
  isMainMeal: boolean;
  priorBias: number;
  /** 0..1；< 0.7 时前端必须要求用户确认（design/0005 §4.3） */
  confidence: number;
  /** 20 字以内的判断依据，落库以便日后回溯是分类错还是算法错 */
  reason: string;
}

export interface NoteAnalyzer {
  extractCandidates(text: string): Promise<NoteExtraction>;
  classify(input: ClassifyInput): Promise<Classification>;
}

// ── 4. 导入预览：前端拿到的完整对象 ───────────────────────────────────

export interface ImportPreview {
  /** 已拼好的引擎餐厅对象，距离与 bucket 已按锚点算好 */
  restaurant: Restaurant;
  /** 这份事实数据是什么时候从 Places 抓的；30 天 TTL 的判据 */
  fetchedAt: string;
  /** 一行人话的抓取摘要，随餐厅落库，便于在 Supabase 里直接看「我们抓到了什么」 */
  summary: string;
  /** 与笔记一起抽到的菜品；无笔记时为空数组 */
  dishes: DishMention[];
  /** true = 该 placeId 已在当前身份的池子里 */
  alreadyInPool: boolean;
  /** true = 用的是 fixture 数据（缺少 API key），UI 需标注「演示数据」 */
  demo: boolean;
}

// ── 5. HTTP 契约（前端只认这三个端点）─────────────────────────────────

/** POST /api/explore/search  { query } → { candidates, demo } */
export interface SearchRequest { query: string }
export interface SearchResponse { candidates: PlaceCandidate[]; demo: boolean }

/** POST /api/explore/analyze { text } → { queries, dishes, demo } */
export interface AnalyzeRequest { text: string }
export interface AnalyzeResponse extends NoteExtraction { demo: boolean }

/** POST /api/explore/preview { placeId, dishes? } → ImportPreview */
export interface PreviewRequest { placeId: string; dishes?: DishMention[] }

/** 任何端点出错时的统一形状；message 是给用户看的中文 */
export interface ApiError { error: true; message: string }

/** 粘贴文本长度上限（design/0005 §6 的成本护栏），前后端都要校验 */
export const MAX_NOTE_CHARS = 8000;

// ── 6. 抓取台账与缓存时效 ─────────────────────────────────────────────

/**
 * 每一次对外抓取都记一行（Hao 2026-09-25 的要求：
 * 「每次抓更多餐厅时保留一份抓到了什么的摘要」）。
 * 按身份存：登录走 Supabase `fetch_log`，游客走 localStorage 命名空间。
 */
export interface FetchLogEntry {
  at: string;
  kind: 'search' | 'analyze' | 'preview' | 'refresh';
  /** 搜索词或笔记摘要（笔记只留前 80 字，原文在 sources 表） */
  query?: string;
  placeId?: string;
  placeName?: string;
  /** google / fixture / deepseek / fixture-llm */
  provider: string;
  resultCount?: number;
  outcome: 'ok' | 'not_found' | 'error';
  note?: string;
}

/**
 * 餐厅事实数据的缓存时效（Hao 2026-09-25：「先按每月更新」）。
 * 超过这个天数就认为营业时间/评分可能已经变了，下次碰到时重抓。
 */
export const FACTS_TTL_DAYS = 30;

export function isStale(fetchedAt: string, now: Date = new Date()): boolean {
  const t = Date.parse(fetchedAt);
  if (Number.isNaN(t)) return true;
  return (now.getTime() - t) / 86_400_000 > FACTS_TTL_DAYS;
}
