/**
 * GTA 餐厅种子数据 v2 — Downtown Markham 锚点
 *
 * 数据来源：Google Places API（2026-08 抓取），place_id / 坐标 / 营业时间为真实数据。
 * 分类字段由分类器 + 人工判定。
 *
 * 距离锚点：Downtown Markham (43.8536, -79.3227)
 *   —— Enterprise Blvd / Rivis Rd 一带，Cineplex VIP 与 Markham Civic Centre 之间。
 *   如果你的实际锚点是 Markham Village 老城 Main St (43.877, -79.262)，
 *   或 Unionville Main St (43.8655, -79.3102)，用 recomputeDistances() 重算。
 *
 * ⚠️ v2 相对 v1 的 schema 变更（见文件末尾说明）：
 *   - closesAt: string          →  serviceWindows: ServiceWindow[]   （支持午休断档）
 *   - 新增 dineIn: boolean                                            （纯外带店）
 *   - pool 字段已移除                                                 （Markham 锚点下不再需要双池）
 */
 
export interface ServiceWindow {
  /** 0=周日 … 6=周六；null 表示每天适用 */
  day: number | null;
  open: string;   // 'HH:mm'
  close: string;  // 'HH:mm'，跨零点用 '26:00' 表示次日 2:00
}
 
export interface SeedRestaurant {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
 
  primary: string;
  tags: string[];
 
  soloFriendly: boolean;
  slotLock: Array<'breakfast' | 'lunch' | 'dinner' | 'latenight'>;
  isMainMeal: boolean;
  priorBias: number;
 
  /** false = 纯外带，无堂食 */
  dineIn: boolean;
 
  priceLevel: number | null;
  rating: number;
  ratingCount: number;
 
  /** 每周固定休息日，0=周日 … 6=周六 */
  closedDays: number[];
  /** 分段营业时间；空数组表示 24 小时 */
  serviceWindows: ServiceWindow[];
 
  distanceKm: number;
  bucket: 'WALK' | 'NEAR' | 'MID' | 'FAR';
 
  confidence: number;
  reason: string;
}
 
const ALL_DAY: ServiceWindow[] = [];
const w = (open: string, close: string): ServiceWindow => ({ day: null, open, close });
 
export const SEED_RESTAURANTS: SeedRestaurant[] = [
  // ══════════════════════════════════════════════════════════
  // WALK  < 1.2 km —— Downtown Markham / Hwy 7 走廊
  // ══════════════════════════════════════════════════════════
  {
    placeId: 'ChIJ9UdHvp7V1IkRrzDFGuV0VBM',
    name: '15th Ave Cafe & Bistro',
    address: '169 Enterprise Blvd, Markham',
    lat: 43.8492982, lng: -79.3238633,
    primary: 'WS_BRUNCH',
    tags: ['WS_BRUNCH', 'WS_CAFE'],
    soloFriendly: true,
    slotLock: ['breakfast', 'lunch'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 2,
    rating: 4.3, ratingCount: 170,
    closedDays: [],
    serviceWindows: [w('09:00', '16:00')],
    distanceKm: 0.5, bucket: 'WALK',
    confidence: 0.95,
    reason: 'Google primaryType=brunch_restaurant，Enterprise Blvd 电影院楼下，法式咖啡馆装修',
  },
  {
    placeId: 'ChIJaeTnfgDV1IkRsLd7I1O40QU',
    name: 'Number One BBQ Bar 南波萬烧烤酒馆',
    address: '3760 Hwy 7 Unit 1, Markham',
    lat: 43.8566659, lng: -79.3328873,
    primary: 'CN_SKEWER',
    tags: ['CN_SKEWER', 'CN_NORTHEAST'],
    soloFriendly: false,
    slotLock: ['dinner', 'latenight'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 2,
    rating: 4.7, ratingCount: 513,
    closedDays: [],
    // ⚠️ 午休断档 14:30–17:30，周五六延到凌晨 3:30
    serviceWindows: [
      { day: null, open: '11:30', close: '14:30' },
      { day: 0, open: '17:00', close: '26:00' },
      { day: 1, open: '17:30', close: '26:00' },
      { day: 2, open: '17:30', close: '26:00' },
      { day: 3, open: '17:30', close: '26:00' },
      { day: 4, open: '17:30', close: '26:00' },
      { day: 5, open: '17:30', close: '27:30' },
      { day: 6, open: '17:00', close: '27:30' },
    ],
    distanceKm: 0.9, bucket: 'WALK',
    confidence: 0.85,
    reason: '烧烤 + 驻唱酒馆复合业态；评论重点在表演和酒水，餐食为辅 → 强社交场景',
  },
  {
    placeId: 'ChIJDzffMADV1IkRzi6wVGqcvfE',
    name: 'Akoya Izakaya',
    address: '8601 Warden Ave, Unionville',
    lat: 43.8581453, lng: -79.3322391,
    primary: 'AS_IZAKAYA',
    tags: ['AS_IZAKAYA', 'AS_SUSHI'],
    soloFriendly: false,
    slotLock: ['dinner'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: null,
    rating: 4.4, ratingCount: 461,
    closedDays: [],
    serviceWindows: [w('11:00', '14:30'), w('17:00', '22:30')],
    distanceKm: 0.9, bucket: 'WALK',
    confidence: 0.9,
    reason: 'Google type=japanese_restaurant；评论主打刺身拼盘、omakase、串烧 → 居酒屋。付现有优惠',
  },
  {
    placeId: 'ChIJk9HrBBXV1IkRbJCRb3lYFVk',
    name: 'Sushi Umi (Markham)',
    address: '3621 Hwy 7 Unit 104-105, Markham',
    lat: 43.8541102, lng: -79.3371383,
    primary: 'AS_SUSHI',
    tags: ['AS_SUSHI'],
    soloFriendly: true,
    slotLock: ['lunch', 'dinner'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 4,          // ⚠️ 全池最贵，omakase
    rating: 4.8, ratingCount: 950,
    closedDays: [0],        // 周日休
    // ⚠️ 午市窗口极窄：仅 75 分钟
    serviceWindows: [
      { day: 1, open: '12:30', close: '13:45' }, { day: 1, open: '17:00', close: '22:00' },
      { day: 2, open: '12:30', close: '13:45' }, { day: 2, open: '17:00', close: '22:00' },
      { day: 3, open: '12:30', close: '13:45' }, { day: 3, open: '17:00', close: '22:00' },
      { day: 4, open: '12:30', close: '13:45' }, { day: 4, open: '17:00', close: '22:00' },
      { day: 5, open: '12:30', close: '13:45' }, { day: 5, open: '17:00', close: '22:00' },
      { day: 6, open: '12:00', close: '14:45' }, { day: 6, open: '17:00', close: '22:00' },
    ],
    distanceKm: 1.2, bucket: 'WALK',
    confidence: 0.98,
    reason: 'Google type=sushi_restaurant，price_level=4，omakase 为主。需预约',
  },
 
  // ══════════════════════════════════════════════════════════
  // NEAR  1.2 – 5 km —— Unionville / Kennedy / First Markham Place
  // ══════════════════════════════════════════════════════════
  {
    placeId: 'ChIJCSVLKujV1IkRE2jQGIG9xFA',
    name: 'Sung Won Korean Restaurant',
    address: '4431 Hwy 7, Unionville',
    lat: 43.8607857, lng: -79.3114244,
    primary: 'AS_KOREAN',
    tags: ['AS_KOREAN'],
    soloFriendly: true,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: false,          // ⚠️ 纯外带，无堂食
    priceLevel: 1,
    rating: 4.5, ratingCount: 401,
    closedDays: [],
    serviceWindows: [w('10:30', '21:00')],
    distanceKm: 1.2, bucket: 'NEAR',
    confidence: 0.95,
    reason: 'Google type=korean_restaurant；评论主打猪骨汤、冷面、拌饭。多条评论确认 takeout only',
  },
  {
    placeId: 'ChIJX3vySnHV1IkRaSg2twVY5ZQ',
    name: "Mom's Pan-Fried Bun",
    address: '8362 Kennedy Rd, Markham',
    lat: 43.8603242, lng: -79.3033707,
    primary: 'CN_JIANGZHE',
    tags: ['CN_JIANGZHE', 'CN_DUMPLING', 'CN_NOODLE'],
    soloFriendly: true,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 1,
    rating: 4.6, ratingCount: 1549,
    closedDays: [],
    serviceWindows: [w('10:00', '22:00')],
    distanceKm: 1.7, bucket: 'NEAR',
    confidence: 0.9,
    reason: '招牌生煎包 + 小笼 + 红烧肉饭 → 江浙沪。午市需排队 15-20 分钟，有叫号短信',
  },
  {
    placeId: 'ChIJdyI0n-7V1IkRhcKmL46NtYM',
    name: 'Yunshang Rice Noodle 云尚米线 (Unionville)',
    address: '8380 Kennedy Rd C4, Markham',
    lat: 43.8608284, lng: -79.3041129,
    primary: 'CN_YUNNAN',
    tags: ['CN_YUNNAN', 'CN_NOODLE'],
    soloFriendly: true,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 1,
    rating: 4.8, ratingCount: 1187,
    closedDays: [],
    serviceWindows: [w('11:00', '22:00')],
    distanceKm: 1.7, bucket: 'NEAR',
    confidence: 0.97,
    reason: '过桥米线连锁，米线免费续。仅收现金和 debit',
  },
  {
    placeId: 'ChIJAdkyAADV1IkRvOOh1wdIPDw',
    name: 'Cantonese Best BBQ 港式燒味大王',
    address: '11 Fairburn Dr Unit 19, Markham',
    lat: 43.8477346, lng: -79.3481742,
    primary: 'CN_BBQ_MEAT',
    tags: ['CN_BBQ_MEAT', 'CN_CANTON'],
    soloFriendly: true,
    slotLock: ['lunch', 'dinner'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 1,
    rating: 3.9, ratingCount: 168,
    closedDays: [],
    serviceWindows: [w('11:00', '19:00')],   // 19:00 打烊，晚餐窗口窄
    distanceKm: 2.1, bucket: 'NEAR',
    confidence: 0.96,
    reason: '店名含「燒味」；评论主打烧鸭、烧肉、叉烧、乳猪。First Markham Place 旁',
  },
  {
    placeId: 'ChIJ5_XZWHrV1IkRVEAkrR6jQ4k',
    name: 'Cafe De Hong Kong 良心冰室',
    address: '11 Fairburn Dr Unit 12-15, Markham',
    lat: 43.8477774, lng: -79.34849,
    primary: 'CN_HK_CAFE',
    tags: ['CN_HK_CAFE', 'CN_CANTON'],
    soloFriendly: true,
    slotLock: ['breakfast', 'lunch'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 1,
    rating: 4.1, ratingCount: 1467,
    closedDays: [2],        // 周二休
    serviceWindows: [w('10:00', '19:00')],
    distanceKm: 2.2, bucket: 'NEAR',
    confidence: 0.97,
    reason: '店名「冰室」；丝袜奶茶、滑蛋、焗饭、肠粉。排队 20-40 分钟，停车位紧张',
  },
  {
    placeId: 'ChIJfyEHtu7U1IkRpFr5oTysvdo',
    name: 'Mei Nung Beef Noodle House 美濃',
    address: '3229 Hwy 7 Unit 15, Markham',
    lat: 43.8483038, lng: -79.3491405,
    primary: 'CN_TAIWAN',
    tags: ['CN_TAIWAN', 'CN_NOODLE'],
    soloFriendly: true,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 1,
    rating: 4.2, ratingCount: 704,
    closedDays: [2],        // 周二休
    serviceWindows: [w('11:30', '21:00')],
    distanceKm: 2.2, bucket: 'NEAR',
    confidence: 0.98,
    reason: 'Google type=taiwanese_restaurant；牛肉面 + 臭豆腐。⚠️ 多条评论提到全店臭豆腐味重',
  },
  {
    placeId: 'ChIJ_fSIGGHX1IkRZE5RcrStUI8',
    name: 'Haidilao Hot Pot 海底捞 (Markham)',
    address: '5328 Hwy 7 Ste 4, Markham',
    lat: 43.8688939, lng: -79.2815123,
    primary: 'CN_HOTPOT',
    tags: ['CN_HOTPOT', 'CN_SICHUAN'],
    soloFriendly: false,
    slotLock: ['dinner', 'latenight'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 2,
    rating: 4.8, ratingCount: 7311,
    closedDays: [],
    serviceWindows: [w('11:00', '26:00')],
    distanceKm: 3.7, bucket: 'NEAR',
    confidence: 0.99,
    reason: 'Google type=hot_pot_restaurant。人均 $45-80，需凑人。20:30 后有 AYCE 夜宵档',
  },
  {
    placeId: 'ChIJHRoMY_zT1IkRJxQPeox8fJc',
    name: 'Magic Noodle 一碗面',
    address: '2190 McNicoll Ave #119, Scarborough',
    lat: 43.8144605, lng: -79.2943562,
    primary: 'CN_NOODLE',
    tags: ['CN_NOODLE', 'CN_NORTHEAST', 'CN_DUMPLING'],
    soloFriendly: true,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 1,
    rating: 4.5, ratingCount: 5340,
    closedDays: [],
    serviceWindows: ALL_DAY,   // ⚠️ 24 小时营业，夜宵池的锚
    distanceKm: 4.9, bucket: 'NEAR',
    confidence: 0.95,
    reason: '手拉面连锁，此店 24h。评论提到菜量与图片不符的投诉，但整体评分稳定',
  },
 
  // ══════════════════════════════════════════════════════════
  // MID  5 – 15 km —— Richmond Hill / West Beaver Creek
  // ══════════════════════════════════════════════════════════
  {
    placeId: 'ChIJNZwyQjErK4gRiq6FhWcnkOU',
    name: 'Nian Yi Kuai Zi 廿一筷子',
    address: '505 Hwy 7, Markham',
    lat: 43.8419956, lng: -79.3870018,
    primary: 'CN_SICHUAN',
    tags: ['CN_SICHUAN'],
    soloFriendly: false,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 2,
    rating: 4.7, ratingCount: 3071,
    closedDays: [],
    serviceWindows: [w('11:30', '22:30')],
    distanceKm: 5.3, bucket: 'MID',
    confidence: 0.95,
    reason: '水煮鱼、麻辣鸡、花椒高频出现。评论明确「所有菜为分享设计」，需排队',
  },
  {
    placeId: 'ChIJBZgY9csrK4gRLgFdqS50OV0',
    name: 'Northern Chinese Specialties',
    address: '280 West Beaver Creek Rd #25, Richmond Hill',
    lat: 43.8439451, lng: -79.3890568,
    primary: 'CN_NORTHEAST',
    tags: ['CN_NORTHEAST', 'CN_SKEWER'],
    soloFriendly: false,
    slotLock: [],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: 2,
    rating: 4.6, ratingCount: 127,
    closedDays: [],
    serviceWindows: [w('11:00', '23:00')],
    distanceKm: 5.4, bucket: 'MID',
    confidence: 0.93,
    reason: '⚠️ Google types 只有泛型 restaurant，无中餐标记。靠评论中的锅包肉、地三鲜、酱猪蹄判定东北菜',
  },
  {
    placeId: 'ChIJHbAbOkkrK4gR765Ghi3euGk',
    name: 'Yu Seafood 御',
    address: '270 West Beaver Creek Rd, Richmond Hill',
    lat: 43.8444398, lng: -79.3873724,
    primary: 'CN_DIMSUM',
    tags: ['CN_DIMSUM', 'CN_CANTON'],
    soloFriendly: false,
    slotLock: ['breakfast', 'lunch'],
    isMainMeal: true,
    priorBias: 1.0,
    dineIn: true,
    priceLevel: null,
    rating: 4.0, ratingCount: 3988,
    closedDays: [],
    serviceWindows: [w('09:00', '23:00')],
    distanceKm: 5.3, bucket: 'MID',
    confidence: 0.9,
    reason: '9:00 开门 + 评论高频虾饺/潮州粉果/烧腊 → 早茶为主，晚市转海鲜粤菜。排队 30-40 分钟',
  },
];
 
// ════════════════════════════════════════════════════════════
// v2 schema 变更说明
// ════════════════════════════════════════════════════════════
//
// 【变更 1】closesAt: string → serviceWindows: ServiceWindow[]
//
// Markham 这批店里有大量「午市 + 晚市」分段营业，中间断档 2-3 小时：
//   Number One BBQ  11:30-14:30 / 17:30-02:00   （断档 3 小时）
//   Akoya Izakaya   11:00-14:30 / 17:00-22:30   （断档 2.5 小时）
//   Sushi Umi       12:30-13:45 / 17:00-22:00   （午市仅 75 分钟）
//
// 单个 closesAt 完全无法表达这种结构。如果不改，下午 3 点打开 App
// 会推出三家实际关着门的店 —— 这是最伤信任的一类错误，因为用户
// 通常已经出门或已经决定了才发现。
//
// 【变更 2】新增 dineIn: boolean
//
// Sung Won 是纯外带。对「今天去哪吃」这个场景，纯外带店是另一种东西，
// 不该和堂食店在同一个池子里无差别竞争。
//
// 【变更 3】移除 pool 字段
//
// Brampton 锚点下需要工作日/周末双池，因为正宗中餐全在 30km 外。
// Markham DT 锚点下这个问题不存在（见下方 auditPool 输出），双池是纯粹的复杂度。
 
// ════════════════════════════════════════════════════════════
// 工具函数
// ════════════════════════════════════════════════════════════
 
export function haversineKm(
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
 
export function toBucket(km: number): SeedRestaurant['bucket'] {
  if (km < 1.2) return 'WALK';
  if (km < 5) return 'NEAR';
  if (km < 15) return 'MID';
  return 'FAR';
}
 
/** 常用锚点 */
export const ANCHORS = {
  downtownMarkham: { lat: 43.8536, lng: -79.3227, label: 'Downtown Markham' },
  markhamVillage:  { lat: 43.8770, lng: -79.2620, label: 'Markham Village Main St' },
  unionville:      { lat: 43.8655, lng: -79.3102, label: 'Unionville Main St' },
} as const;
 
export function recomputeDistances(
  anchorLat: number,
  anchorLng: number,
  list: SeedRestaurant[] = SEED_RESTAURANTS,
): SeedRestaurant[] {
  return list.map((r) => {
    const km = haversineKm(anchorLat, anchorLng, r.lat, r.lng);
    return { ...r, distanceKm: Math.round(km * 10) / 10, bucket: toBucket(km) };
  });
}
 
/**
 * 判断某个时刻餐厅是否营业。
 * now 用本地时间；跨零点窗口以 '26:00' 形式表示，会自动折算到前一天。
 */
export function isOpenAt(r: SeedRestaurant, now: Date): boolean {
  const day = now.getDay();
  if (r.closedDays.includes(day)) return false;
  if (r.serviceWindows.length === 0) return true;   // 24h
 
  const mins = now.getHours() * 60 + now.getMinutes();
  const parse = (s: string) => {
    const [h, m] = s.split(':').map(Number);
    return h * 60 + m;
  };
 
  return r.serviceWindows.some((win) => {
    const open = parse(win.open);
    const close = parse(win.close);
 
    if (win.day === null || win.day === day) {
      if (close <= 1440) return mins >= open && mins < close;
      return mins >= open;                          // 当天延到次日
    }
    // 前一天的跨零点窗口延伸到今天凌晨
    const prevDay = (day + 6) % 7;
    if (close > 1440 && (win.day === prevDay)) {
      return mins < close - 1440;
    }
    return false;
  });
}
 
// ════════════════════════════════════════════════════════════
// 池子自检
// ════════════════════════════════════════════════════════════
 
export function auditPool(list: SeedRestaurant[] = SEED_RESTAURANTS) {
  const byBucket = list.reduce<Record<string, number>>((acc, r) => {
    acc[r.bucket] = (acc[r.bucket] ?? 0) + 1;
    return acc;
  }, {});
 
  return {
    total: list.length,
    byBucket,                                        // { WALK: 4, NEAR: 8, MID: 3 }  ← FAR 为空
    medianDistanceKm: [...list].sort((a, b) => a.distanceKm - b.distanceKm)[
      Math.floor(list.length / 2)
    ].distanceKm,                                    // 2.2
    cuisines: [...new Set(list.map((r) => r.primary))].length,   // 15 家 15 个不同 primary
    withServiceGap: list.filter((r) => r.serviceWindows.length > 1).length,
    closedSomeDay: list.filter((r) => r.closedDays.length > 0).length,
    takeoutOnly: list.filter((r) => !r.dineIn).length,
    needsReview: list.filter((r) => r.confidence < 0.7).map((r) => r.name),  // []
  };
}