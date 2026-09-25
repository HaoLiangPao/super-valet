import type {
  Classification,
  PlaceCandidate,
  PlaceDetails,
  PlaceProvider,
} from './contract';
import { NotFoundError } from './errors';
import { convertOpeningHours } from './hours';
import type { GooglePeriod } from './hours';

/**
 * 离线 / 确定性的 Places 实现（ADR-0007 §3）。
 *
 * 存在的理由有三个，按重要性排：
 *   1. 单测绝不该打计费 API；
 *   2. 没有密钥时整条导入流水线仍然能开发、能验收（本轮正是如此）；
 *   3. 新试玩者在密钥缺失时看到的是「演示数据」而不是一个报错页。
 *
 * 目录刻意覆盖四种形态，与 `test/explore.test.ts` 一一对应：
 *   - 「海底捞」→ 两家候选（多选一）
 *   - 「寿司」→ 一家候选（直接进预览）
 *   - 「麦当劳」→ 零候选（空态）
 *   - 阿婆私房菜 → primaryType 未命中规则表 → 低置信度分类（强制人工确认）
 *
 * 营业时间刻意用 Google 的 period 形状写，再过一遍 `convertOpeningHours`：
 * fixture 和真实 provider 走的是同一个转换器，转换器错了 fixture 也会错，
 * 不会出现「测试全绿但线上营业时间是歪的」。
 */

interface FixturePlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primaryType: string;
  rating: number;
  ratingCount: number;
  priceLevel: number | null;
  dineIn: boolean;
  periods: GooglePeriod[];
  editorialSummary?: string;
  reviewSnippets: string[];
  /** 命中这些关键词的查询会返回这家店（全部小写比较） */
  keywords: string[];
  classification: Classification;
}

const hm = (hour: number, minute = 0) => ({ hour, minute });

/** 每天 open→close 的一组 period；close 落在次日用 dayOffset = 1 */
function daily(
  open: { hour: number; minute: number },
  close: { hour: number; minute: number },
  dayOffset = 0,
  days: number[] = [0, 1, 2, 3, 4, 5, 6],
): GooglePeriod[] {
  return days.map((day) => ({
    open: { day, ...open },
    close: { day: (day + dayOffset) % 7, ...close },
  }));
}

export const FIXTURE_PLACES: readonly FixturePlace[] = [
  {
    placeId: 'fixture-haidilao-markham',
    name: '海底捞火锅 Haidilao (First Markham Place)',
    address: '3255 Hwy 7 E Unit 10, Markham, ON',
    lat: 43.8494,
    lng: -79.354,
    primaryType: 'chinese_restaurant',
    rating: 4.6,
    ratingCount: 2180,
    priceLevel: 3,
    dineIn: true,
    // 11:00 开到次日 02:00 —— 跨零点，转换后应为 '26:00'
    periods: daily(hm(11), hm(2), 1),
    editorialSummary: '连锁川味火锅，以服务和等位小食著称，营业到深夜。',
    reviewSnippets: [
      '番茄锅底和毛肚都很稳，等位还有免费美甲。',
      '半夜十二点来还有位置，服务员一直在加水。',
      '虾滑现打的，比外面好吃不少。',
    ],
    keywords: ['海底捞', 'haidilao', '火锅', 'hotpot', '毛肚'],
    classification: {
      primary: 'CN_HOTPOT',
      tags: ['CN_HOTPOT', 'CN_SICHUAN'],
      soloFriendly: true,
      slotLock: ['lunch', 'dinner', 'latenight'],
      isMainMeal: true,
      priorBias: 1.0,
      confidence: 0.95,
      reason: '连锁川味火锅，评论集中在锅底与服务',
    },
  },
  {
    placeId: 'fixture-haidilao-richmondhill',
    name: '海底捞火锅 Haidilao (Times Square)',
    address: '550 Hwy 7 E Unit 75, Richmond Hill, ON',
    lat: 43.842,
    lng: -79.418,
    primaryType: 'chinese_restaurant',
    rating: 4.4,
    ratingCount: 980,
    priceLevel: 3,
    dineIn: true,
    // 周中开到次日 01:00、周五六开到 02:30 —— 各天不一致，转换器不应收敛成 day:null
    periods: [
      ...daily(hm(11, 30), hm(1), 1, [0, 1, 2, 3, 4]),
      ...daily(hm(11, 30), hm(2, 30), 1, [5, 6]),
    ],
    editorialSummary: '连锁川味火锅的列治文山分店。',
    reviewSnippets: ['锅底一样，位置更好停车。', '周末等位一小时起。'],
    keywords: ['海底捞', 'haidilao', '火锅', 'hotpot'],
    classification: {
      primary: 'CN_HOTPOT',
      tags: ['CN_HOTPOT', 'CN_SICHUAN'],
      soloFriendly: true,
      slotLock: ['lunch', 'dinner', 'latenight'],
      isMainMeal: true,
      priorBias: 1.0,
      confidence: 0.93,
      reason: '同一连锁品牌的分店',
    },
  },
  {
    placeId: 'fixture-sushi-ten',
    name: 'Sushi Ten 寿司天',
    address: '8360 Kennedy Rd Unit 22, Markham, ON',
    lat: 43.8565,
    lng: -79.3045,
    primaryType: 'sushi_restaurant',
    rating: 4.5,
    ratingCount: 430,
    priceLevel: 2,
    dineIn: true,
    // 午休断档 + 周一休：午市 11:30–14:00，晚市 17:00–21:30
    periods: [
      ...daily(hm(11, 30), hm(14), 0, [0, 2, 3, 4, 5, 6]),
      ...daily(hm(17), hm(21, 30), 0, [0, 2, 3, 4, 5, 6]),
    ],
    editorialSummary: '社区寿司店，午市定食性价比高。',
    reviewSnippets: ['午市定食 $16 有刺身有天妇罗。', '三文鱼很新鲜，师傅是日本人。'],
    keywords: ['寿司', 'sushi', '刺身', '日料'],
    classification: {
      primary: 'AS_SUSHI',
      tags: ['AS_SUSHI'],
      soloFriendly: true,
      slotLock: ['lunch', 'dinner'],
      isMainMeal: true,
      priorBias: 1.0,
      confidence: 0.95,
      reason: 'Google 类型直接命中',
    },
  },
  {
    placeId: 'fixture-mystery-kitchen',
    name: '阿婆私房菜',
    address: '4300 Steeles Ave E Unit 118, Markham, ON',
    lat: 43.8156,
    lng: -79.3234,
    primaryType: 'restaurant',
    rating: 4.2,
    ratingCount: 61,
    priceLevel: 2,
    dineIn: true,
    // 只做晚市，周二休
    periods: daily(hm(17), hm(22), 0, [0, 1, 3, 4, 5, 6]),
    reviewSnippets: ['老板娘自己做的家常菜，分量很大。', '没有菜单，看当天有什么。'],
    keywords: ['私房菜', '阿婆', '家常菜'],
    classification: {
      primary: 'CN_JIANGZHE',
      tags: ['CN_JIANGZHE'],
      soloFriendly: false,
      slotLock: ['dinner'],
      isMainMeal: true,
      priorBias: 1.0,
      // 刻意 < 0.7：design/0005 §4.3 要求前端标黄并强制用户确认分类
      confidence: 0.55,
      reason: '评论只说家常菜，菜系不确定',
    },
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '');
}

function matches(place: FixturePlace, query: string): boolean {
  const q = normalize(query);
  if (!q) return false;
  if (normalize(place.name).includes(q)) return true;
  return place.keywords.some((k) => q.includes(normalize(k)) || normalize(k).includes(q));
}

export function fixtureCandidate(place: FixturePlace): PlaceCandidate {
  return {
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    primaryType: place.primaryType,
    rating: place.rating,
    ratingCount: place.ratingCount,
  };
}

export function fixtureDetails(place: FixturePlace): PlaceDetails {
  const { serviceWindows, closedDays } = convertOpeningHours({ periods: place.periods });
  return {
    placeId: place.placeId,
    name: place.name,
    address: place.address,
    lat: place.lat,
    lng: place.lng,
    priceLevel: place.priceLevel,
    rating: place.rating,
    ratingCount: place.ratingCount,
    serviceWindows,
    closedDays,
    dineIn: place.dineIn,
    primaryType: place.primaryType,
    reviewSnippets: place.reviewSnippets.slice(0, 5),
    ...(place.editorialSummary ? { editorialSummary: place.editorialSummary } : {}),
  };
}

export function findFixturePlace(placeId: string): FixturePlace | undefined {
  return FIXTURE_PLACES.find((p) => p.placeId === placeId);
}

export class FixturePlaceProvider implements PlaceProvider {
  async search(query: string): Promise<PlaceCandidate[]> {
    return FIXTURE_PLACES
      .filter((p) => matches(p, query))
      .sort((a, b) => b.ratingCount - a.ratingCount)
      .map(fixtureCandidate);
  }

  async details(placeId: string): Promise<PlaceDetails> {
    const place = findFixturePlace(placeId);
    if (!place) throw new NotFoundError('没找到这家店，换个关键词试试');
    return fixtureDetails(place);
  }
}
