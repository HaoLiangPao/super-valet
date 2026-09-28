/**
 * 雷达用的纯几何计算——只管「方位角 + 距离 → 屏幕坐标」，不碰任何餐厅/池子逻辑。
 * design/0009 §4.1：SVG 雷达图，同心距离环 + 方位角打点，不是真地图。
 */

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 从 (lat1,lng1) 看向 (lat2,lng2) 的初始方位角（正北 = 0°，顺时针，单位度）。
 * 标准大圆方位角公式，和 `haversineKm` 一样只用于展示，不影响半径过滤。
 */
export function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dLambda = toRad(lng2 - lng1);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  const deg = toDeg(Math.atan2(y, x));
  return (deg + 360) % 360;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * 方位角 + 半径分数（0–1）→ SVG 屏幕坐标，正北朝上（屏幕 y 轴向下，
 * 所以北方向对应 -y）。`radiusFraction` 会被夹到 [0,1]，避免超出雷达画布。
 */
export function polarToScreen(
  bearing: number,
  radiusFraction: number,
  outerRadiusPx: number,
  center: number,
): ScreenPoint {
  const clamped = Math.max(0, Math.min(1, radiusFraction));
  const rad = toRad(bearing);
  const r = clamped * outerRadiusPx;
  return {
    x: center + r * Math.sin(rad),
    y: center - r * Math.cos(rad),
  };
}

/** 雷达刻度环用的显示半径（km）——决定环上标什么数字，与半径过滤无关 */
export function radarScaleKm(effectiveRadiusKm: number, maxObservedKm: number): number {
  if (Number.isFinite(effectiveRadiusKm)) return effectiveRadiusKm;
  // 半径「不限」时没有天然刻度，退而用观察到的最远一家 × 1.15 留白，至少 5km
  return Math.max(5, maxObservedKm * 1.15);
}

/** 环上的 km 文案：<10 保留一位小数，否则取整，避免「4.999999km」这种噪音 */
export function formatRingKm(km: number): string {
  return km < 10 ? `${Math.round(km * 10) / 10}` : `${Math.round(km)}`;
}
