import { SEED_RESTAURANTS, haversineKm, toBucket } from '@/data/seed-restaurants';
import type { Restaurant } from '@/lib/engine/types';
import type {
  Classification,
  DishMention,
  ImportPreview,
  PlaceDetails,
} from './contract';
import { IMPORT_ANCHOR } from './providers';

/**
 * 把「Places 事实 + LLM 分类 + 本地几何」拼成引擎认识的 `Restaurant`。
 *
 * 字段来源对照见 design/0005 §4.3。这个文件是那张表的可执行版本：
 * 每个字段从哪来只在这里写一次，**分类器碰不到事实字段**。
 *
 * 距离不引 PostGIS，本地 Haversine 算（ADR-0003）；
 * 公式与 bucket 阈值直接 import 种子文件的实现，
 * 免得哪天阈值改了这边还按老的分档 —— 两套几何是迟早要对不上的。
 */

export function distanceFrom(
  lat: number,
  lng: number,
  anchor: { lat: number; lng: number } = IMPORT_ANCHOR,
): { distanceKm: number; bucket: Restaurant['bucket'] } {
  const km = haversineKm(anchor.lat, anchor.lng, lat, lng);
  // 与种子数据同一个精度，不然池子里两种小数位看着像 bug
  return { distanceKm: Math.round(km * 10) / 10, bucket: toBucket(km) };
}

export function toRestaurant(
  details: PlaceDetails,
  classification: Classification,
  anchor: { lat: number; lng: number } = IMPORT_ANCHOR,
): Restaurant {
  const { distanceKm, bucket } = distanceFrom(details.lat, details.lng, anchor);
  return {
    // ── 事实：只能来自 Places（design/0005 §4.2）
    placeId: details.placeId,
    name: details.name,
    address: details.address,
    lat: details.lat,
    lng: details.lng,
    dineIn: details.dineIn,
    priceLevel: details.priceLevel,
    rating: details.rating,
    ratingCount: details.ratingCount,
    closedDays: details.closedDays,
    serviceWindows: details.serviceWindows,
    // ── 分类：LLM / 规则表，用户可改
    primary: classification.primary,
    tags: classification.tags,
    soloFriendly: classification.soloFriendly,
    slotLock: classification.slotLock,
    isMainMeal: classification.isMainMeal,
    priorBias: classification.priorBias,
    confidence: classification.confidence,
    reason: classification.reason,
    // ── 几何：本地算
    distanceKm,
    bucket,
  };
}

const SEED_PLACE_IDS = new Set(SEED_RESTAURANTS.map((r) => r.placeId));

/**
 * 服务端能做的查重只有「种子 15 家」这一层 —— 服务端没有用户会话
 * （ADR-0006 刻意不做 SSR 取数），用户自己导入的那部分只有浏览器知道。
 * 前端拿到 preview 后必须再 OR 一次本地池子：
 *   `alreadyInPool || isInPool(placeId)`（`@/lib/store/pool` 导出）。
 */
export function isSeedPlace(placeId: string): boolean {
  return SEED_PLACE_IDS.has(placeId);
}

/**
 * 一行人话的抓取摘要（Hao 2026-09-25 的要求）。
 * 它随餐厅一起落库，目的是让人在 Supabase 里扫一眼就知道
 * 「这条是什么时候、从哪、抓到了什么」，而不必去 join 几张表看原始字段。
 */
export function summarize(
  details: PlaceDetails,
  classification: Classification,
  dishCount: number,
  demo: boolean,
): string {
  const windows = details.serviceWindows.length;
  const parts = [
    `${details.name}`,
    `${classification.primary}(${classification.confidence.toFixed(2)})`,
    `★${details.rating}/${details.ratingCount}`,
    details.priceLevel === null ? '价位未知' : `价位${details.priceLevel}`,
    windows === 0 ? '24小时' : `${windows}段营业`,
    details.closedDays.length > 0 ? `周${details.closedDays.join('')}休` : '无固定休',
    details.dineIn ? '有堂食' : '纯外带',
  ];
  if (dishCount > 0) parts.push(`菜品${dishCount}道`);
  if (demo) parts.push('演示数据');
  return parts.join(' · ');
}

export function buildPreview(args: {
  details: PlaceDetails;
  classification: Classification;
  dishes?: DishMention[];
  alreadyInPool?: boolean;
  demo: boolean;
  anchor?: { lat: number; lng: number };
  now?: Date;
}): ImportPreview {
  const dishes = args.dishes ?? [];
  return {
    restaurant: toRestaurant(args.details, args.classification, args.anchor),
    fetchedAt: (args.now ?? new Date()).toISOString(),
    summary: summarize(args.details, args.classification, dishes.length, args.demo),
    dishes,
    alreadyInPool: args.alreadyInPool ?? isSeedPlace(args.details.placeId),
    demo: args.demo,
  };
}
