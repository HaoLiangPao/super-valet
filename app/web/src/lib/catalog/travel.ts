/**
 * 驾车 / 步行时间估算（design/0009 §4.4）。
 *
 * 为什么是启发式而不是 Distance Matrix API：那个 API **按元素计费**，而这个
 * 数字出现在附近列表的**每一行**上 —— 调不起，也不值得调。design/0002 §6.5
 * 早就指出直线距离在 GTA 会系统性低估（401/DVP 堵车），所以这里用绕路系数 +
 * 平均车速 + 停车时间三个常数把它抬回来，并且**在文案里承认它是估算**。
 *
 * ⚠️ 本文件**只返回结构化数据**，一个中文字都不出现。
 * 「开车约 12 分钟」「步行约 8 分钟」「按直线距离估算」这些话由前端配合
 * `lib/i18n` 出 —— 在数据层拼中文字符串，等于把英文界面写死成半个中文界面。
 */

/** 网格城市的绕路系数（直线 → 实际路网） */
export const DETOUR = 1.3;
/** Markham 主干道含红灯的平均车速 km/h */
export const SPEED_KMH = 35;
/** 找车位 + 走进门的固定开销，分钟 */
export const PARKING_MIN = 3;

/**
 * 步行 / 开车的分界。与 `RADIUS_KM.WALK` 和 `toBucket()` 的 WALK 阈值**同一个数**：
 * 用户选了「走得到」档看到的每一家，都该显示成走路模式，否则界面自相矛盾。
 * 边界按 `< 1.2` 判（与 `toBucket` 的严格小于一致）：1.19 走路，1.2 开车。
 */
export const WALK_MAX_KM = 1.2;
/** 5 km/h ⇒ 每公里 12 分钟 */
export const WALK_MIN_PER_KM = 12;

export type TravelMode = 'walk' | 'drive';

export interface TravelEstimate {
  mode: TravelMode;
  /** 整数分钟；> 0 的距离至少算 1 分钟，别显示「0 分钟」 */
  minutes: number;
}

/** 每公里的驾车分钟数（≈ 2.23），给 UI 做「每多 1 km 大约多几分钟」的提示用 */
export const DRIVE_MIN_PER_KM = (DETOUR / SPEED_KMH) * 60;

/**
 * 距离（km）→ 出行方式与估算分钟数。
 *
 *   驾车 = km × DETOUR / SPEED_KMH × 60 + PARKING_MIN   ≈ km × 2.2 + 3
 *   步行 = km × 12                                      （< 1.2 km）
 *
 * 脏输入（NaN / Infinity / 负数）一律按 0 处理：这个值会直接进列表的每一行，
 * 让 `NaN 分钟` 出现在界面上比给一个保守的 0 糟得多。
 */
export function travelEstimate(km: number): TravelEstimate {
  const distance = Number.isFinite(km) && km > 0 ? km : 0;

  if (distance < WALK_MAX_KM) {
    return {
      mode: 'walk',
      minutes: distance === 0 ? 0 : Math.max(1, Math.round(distance * WALK_MIN_PER_KM)),
    };
  }

  return {
    mode: 'drive',
    minutes: Math.max(1, Math.round(distance * DRIVE_MIN_PER_KM + PARKING_MIN)),
  };
}
