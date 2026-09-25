import type {
  PlaceCandidate,
  PlaceDetails,
  PlaceProvider,
} from './contract';
import { ProviderError, NotFoundError } from './errors';
import { convertOpeningHours } from './hours';
import type { GoogleOpeningHours } from './hours';

/**
 * Google Places API (New) 实现。
 *
 * 成本护栏（ADR-0007「付出的代价」里点名的三件事之一）：
 * **两个请求都强制带 FieldMask，且只取契约里真正用得上的字段。**
 * Places (New) 按字段分 SKU 计费，不带 mask 会被当成「全字段」按最贵档收。
 * 想省钱就删 mask 里的字段，不要在别处加缓存层 —— mask 是唯一的成本旋钮。
 *
 * mask 里字段的档位（删之前先知道你在省哪一档）：
 *   Essentials  : id / formattedAddress / location
 *   Pro         : displayName / primaryType
 *   Enterprise  : rating / userRatingCount / priceLevel / regularOpeningHours
 *   Ent.+Atmos. : dineIn / editorialSummary / reviews
 *
 * `dineIn` 是引擎硬过滤字段（纯外带店不能推），`editorialSummary` / `reviews`
 * 是分类器的主要输入（design/0002 §8.2），所以 Details 落在最贵的一档上。
 * 导入是低频操作（一个用户一辈子几十次），这个取舍写进 docs/GO-LIVE.md 了。
 */

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const DETAILS_URL = 'https://places.googleapis.com/v1/places';

const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.primaryType',
  'places.rating',
  'places.userRatingCount',
].join(',');

const DETAILS_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'priceLevel',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'dineIn',
  'primaryType',
  'editorialSummary',
  'reviews',
].join(',');

const MAX_RESULTS = 8;
const MAX_REVIEW_SNIPPETS = 5;
const TIMEOUT_MS = 8000;
/** 候选搜索的地理偏置半径；锚点在 Downtown Markham，25km 覆盖整个 GTA 东北 */
const BIAS_RADIUS_M = 25000;

interface GoogleLocalizedText { text?: string; languageCode?: string }

interface GooglePlaceJson {
  id?: string;
  displayName?: GoogleLocalizedText;
  formattedAddress?: string;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  location?: { latitude?: number; longitude?: number };
  priceLevel?: string;
  regularOpeningHours?: GoogleOpeningHours;
  dineIn?: boolean;
  editorialSummary?: GoogleLocalizedText;
  reviews?: Array<{ text?: GoogleLocalizedText; originalText?: GoogleLocalizedText }>;
}

/** Places (New) 的 priceLevel 是枚举字符串，引擎要 1–4 的数字 */
const PRICE_LEVELS: Readonly<Record<string, number | null>> = {
  PRICE_LEVEL_UNSPECIFIED: null,
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

export function toPriceLevel(raw: string | undefined): number | null {
  if (!raw) return null;
  return raw in PRICE_LEVELS ? PRICE_LEVELS[raw] : null;
}

export function toCandidate(place: GooglePlaceJson): PlaceCandidate | null {
  if (!place.id) return null;
  return {
    placeId: place.id,
    name: place.displayName?.text ?? '(未命名)',
    address: place.formattedAddress ?? '',
    ...(place.primaryType ? { primaryType: place.primaryType } : {}),
    ...(typeof place.rating === 'number' ? { rating: place.rating } : {}),
    ...(typeof place.userRatingCount === 'number' ? { ratingCount: place.userRatingCount } : {}),
  };
}

export function toDetails(place: GooglePlaceJson): PlaceDetails {
  if (!place.id) throw new ProviderError('这家店的数据不完整，换一家试试');
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    // 坐标缺失就没法算距离，而距离是引擎的硬输入。
    // design/0005 §4.2：坐标只能来自 Places，绝不允许在这里估一个。
    throw new ProviderError('这家店缺少位置信息，没法加进池子');
  }

  const { serviceWindows, closedDays } = convertOpeningHours(place.regularOpeningHours);
  const reviewSnippets = (place.reviews ?? [])
    .map((r) => r.originalText?.text ?? r.text?.text ?? '')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, MAX_REVIEW_SNIPPETS);

  return {
    placeId: place.id,
    name: place.displayName?.text ?? '(未命名)',
    address: place.formattedAddress ?? '',
    lat,
    lng,
    priceLevel: toPriceLevel(place.priceLevel),
    rating: typeof place.rating === 'number' ? place.rating : 0,
    ratingCount: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
    serviceWindows,
    closedDays,
    // 字段缺失按「有堂食」处理（design/0005 §4.3）；Places 只在明确知道时才给 false
    dineIn: place.dineIn !== false,
    ...(place.primaryType ? { primaryType: place.primaryType } : {}),
    ...(reviewSnippets.length > 0 ? { reviewSnippets } : {}),
    ...(place.editorialSummary?.text ? { editorialSummary: place.editorialSummary.text } : {}),
  };
}

export interface GooglePlacesOptions {
  apiKey: string;
  /** 距离锚点，用作搜索的地理偏置 */
  bias: { lat: number; lng: number };
  fetchImpl?: typeof fetch;
}

export class GooglePlaceProvider implements PlaceProvider {
  private readonly apiKey: string;
  private readonly bias: { lat: number; lng: number };
  private readonly fetchImpl: typeof fetch;

  constructor(options: GooglePlacesOptions) {
    this.apiKey = options.apiKey;
    this.bias = options.bias;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async call(
    url: string,
    init: RequestInit,
    fieldMask: string,
    what: string,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        ...init,
        headers: {
          ...init.headers,
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (cause) {
      console.error(`[explore] ${what} 网络失败`, cause);
      throw new ProviderError('连不上地图服务，稍后再试', { status: 504, cause });
    }

    if (!response.ok) {
      // 上游 body 可能回显请求参数（含 key），只进日志不进响应
      const body = await response.text().catch(() => '');
      console.error(`[explore] ${what} 失败 ${response.status}`, body.slice(0, 500));
      if (response.status === 404) throw new NotFoundError('没找到这家店，换个关键词试试');
      if (response.status === 429) throw new ProviderError('地图服务今天用量到上限了，明天再试', { status: 429 });
      throw new ProviderError('地图服务暂时用不了，稍后再试');
    }

    try {
      return await response.json();
    } catch (cause) {
      console.error(`[explore] ${what} 返回的不是 JSON`, cause);
      throw new ProviderError('地图服务返回了看不懂的数据', { cause });
    }
  }

  async search(query: string, bias?: { lat: number; lng: number }): Promise<PlaceCandidate[]> {
    const center = bias ?? this.bias;
    const json = await this.call(
      SEARCH_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: MAX_RESULTS,
          includedType: 'restaurant',
          regionCode: 'CA',
          locationBias: {
            circle: {
              center: { latitude: center.lat, longitude: center.lng },
              radius: BIAS_RADIUS_M,
            },
          },
        }),
      },
      SEARCH_FIELD_MASK,
      'Text Search',
    );

    const places = (json as { places?: GooglePlaceJson[] }).places ?? [];
    return places
      .map(toCandidate)
      .filter((c): c is PlaceCandidate => c !== null);
  }

  async details(placeId: string): Promise<PlaceDetails> {
    const json = await this.call(
      `${DETAILS_URL}/${encodeURIComponent(placeId)}`,
      { method: 'GET' },
      DETAILS_FIELD_MASK,
      'Place Details',
    );
    return toDetails(json as GooglePlaceJson);
  }
}
