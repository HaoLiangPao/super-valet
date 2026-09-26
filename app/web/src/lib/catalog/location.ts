import { ANCHORS } from '@/data/seed-restaurants';
import { currentBackend } from '@/lib/store/backend';
import { DEFAULT_RADIUS, RADIUS_KM, defaultLocationPrefs } from './types';
import type { Anchor, LocationPrefs, LocationSource, RadiusOption } from './types';

/**
 * 位置与半径偏好（design/0006 §4.3、ADR-0008 决策 3）。
 *
 * 双轨制：锚点（用户设定的家/公司）为主，GPS 可选。
 * **绝不在模块加载或页面加载时请求 GPS 权限** —— 只有用户点「用我当前位置」
 * 才会走到 `requestGps()`。首次体验就弹权限框是劝退用户最快的方式。
 */

/** GPS 参数（design/0002 §6.1 既定）：省电优先、8s 超时、15 分钟内的缓存可用 */
export const GPS_MAX_AGE_MS = 15 * 60 * 1000;
export const GPS_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: GPS_MAX_AGE_MS,
};

/** 预置锚点；坐标复用 `@/data/seed-restaurants` 的 `ANCHORS`，不另立一份事实 */
export const ANCHOR_LIST: Anchor[] = [
  {
    id: 'downtownMarkham',
    labelZh: '万锦市中心',
    labelEn: 'Downtown Markham',
    lat: ANCHORS.downtownMarkham.lat,
    lng: ANCHORS.downtownMarkham.lng,
  },
  {
    id: 'unionville',
    labelZh: '于人村主街',
    labelEn: 'Unionville Main St',
    lat: ANCHORS.unionville.lat,
    lng: ANCHORS.unionville.lng,
  },
  {
    id: 'markhamVillage',
    labelZh: '万锦老城主街',
    labelEn: 'Markham Village Main St',
    lat: ANCHORS.markhamVillage.lat,
    lng: ANCHORS.markhamVillage.lng,
  },
];

/** 降级链的最后一环：永远存在，永远不返回 null */
export const DEFAULT_ANCHOR: Anchor = ANCHOR_LIST[0];

export function findAnchor(id: string): Anchor | null {
  return ANCHOR_LIST.find((a) => a.id === id) ?? null;
}

/* ── 读写偏好 ────────────────────────────────────────────────────── */

function isRadius(v: unknown): v is RadiusOption {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(RADIUS_KM, v);
}

function coords(v: unknown): { lat: number; lng: number } | null {
  if (typeof v !== 'object' || v === null) return null;
  const c = v as { lat?: unknown; lng?: unknown };
  if (typeof c.lat !== 'number' || typeof c.lng !== 'number') return null;
  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
  return { lat: c.lat, lng: c.lng };
}

function sanitizeSource(v: unknown): LocationSource | null {
  const c = coords(v);
  if (!c) return null;
  const s = v as { kind?: unknown; id?: unknown; accuracy?: unknown; ts?: unknown };
  if (s.kind === 'anchor' && typeof s.id === 'string') return { kind: 'anchor', id: s.id, ...c };
  if (s.kind === 'gps') {
    return {
      kind: 'gps',
      ...c,
      accuracy: typeof s.accuracy === 'number' ? s.accuracy : 0,
      ts: typeof s.ts === 'number' ? s.ts : 0,
    };
  }
  return null;
}

function sanitizeLastGps(v: unknown): LocationPrefs['lastGps'] {
  const c = coords(v);
  if (!c) return null;
  const g = v as { ts?: unknown };
  return { ...c, ts: typeof g.ts === 'number' ? g.ts : 0 };
}

/** 偏好存的是用户数据（localStorage 或 DB），一律当不可信输入清洗 */
export function sanitizeLocationPrefs(raw: unknown): LocationPrefs {
  if (typeof raw !== 'object' || raw === null) return defaultLocationPrefs();
  const p = raw as Partial<LocationPrefs>;
  return {
    source: sanitizeSource(p.source),
    radius: isRadius(p.radius) ? p.radius : DEFAULT_RADIUS,
    lastGps: sanitizeLastGps(p.lastGps),
  };
}

export function loadLocationPrefs(): LocationPrefs {
  return sanitizeLocationPrefs(currentBackend().loadLocationPrefs());
}

export function saveLocationPrefs(prefs: LocationPrefs): LocationPrefs {
  const clean = sanitizeLocationPrefs(prefs);
  currentBackend().saveLocationPrefs(clean);
  return clean;
}

/** 选锚点：同时关掉 GPS（source 换成 anchor），但保留 lastGps 备用 */
export function setAnchor(anchorId: string): LocationPrefs {
  const anchor = findAnchor(anchorId) ?? DEFAULT_ANCHOR;
  return saveLocationPrefs({
    ...loadLocationPrefs(),
    source: { kind: 'anchor', id: anchor.id, lat: anchor.lat, lng: anchor.lng },
  });
}

export function setRadius(radius: RadiusOption): LocationPrefs {
  return saveLocationPrefs({ ...loadLocationPrefs(), radius });
}

/** 关掉「用我当前位置」，退回锚点 */
export function clearGps(): LocationPrefs {
  const prefs = loadLocationPrefs();
  if (prefs.source?.kind !== 'gps') return prefs;
  return saveLocationPrefs({ ...prefs, source: null });
}

export function radiusKm(radius: RadiusOption): number {
  return RADIUS_KM[radius] ?? RADIUS_KM.ALL;
}

/* ── GPS ─────────────────────────────────────────────────────────── */

export type GpsFailure = 'unsupported' | 'denied' | 'unavailable' | 'timeout';

export interface GpsFix {
  lat: number;
  lng: number;
  accuracy: number;
  ts: number;
}

export type GpsResult =
  | { ok: true; fix: GpsFix; prefs: LocationPrefs }
  | { ok: false; reason: GpsFailure; prefs: LocationPrefs };

function failureOf(code: number): GpsFailure {
  if (code === 1) return 'denied';
  if (code === 3) return 'timeout';
  return 'unavailable';
}

/**
 * 主动取一次 GPS。**只有用户点按钮才该调这个函数** —— 它会弹权限框。
 *
 * 成功：写进 `source`（当前生效位置）与 `lastGps`（降级链的第二环）。
 * 失败：**一个字都不改**，让 `resolveLocation()` 沿降级链自己走下去；
 * 把失败写成「位置未知」反而会抹掉上次成功的位置。
 */
export function requestGps(): Promise<GpsResult> {
  const geo = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
  if (!geo) {
    return Promise.resolve({ ok: false, reason: 'unsupported', prefs: loadLocationPrefs() });
  }
  return new Promise<GpsResult>((resolve) => {
    geo.getCurrentPosition(
      (pos) => {
        const fix: GpsFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? 0,
          ts: pos.timestamp || Date.now(),
        };
        const prefs = saveLocationPrefs({
          ...loadLocationPrefs(),
          source: { kind: 'gps', lat: fix.lat, lng: fix.lng, accuracy: fix.accuracy, ts: fix.ts },
          lastGps: { lat: fix.lat, lng: fix.lng, ts: fix.ts },
        });
        resolve({ ok: true, fix, prefs });
      },
      (err: GeolocationPositionError) => {
        resolve({ ok: false, reason: failureOf(err.code), prefs: loadLocationPrefs() });
      },
      GPS_OPTIONS,
    );
  });
}

/* ── 降级链 ──────────────────────────────────────────────────────── */

/** 位置最终是从哪一环拿到的，UI 可以据此提示「GPS 不可用，按锚点算」 */
export type LocationVia = 'gps' | 'lastGps' | 'anchor' | 'defaultAnchor';

export interface ResolvedLocation {
  lat: number;
  lng: number;
  /** 与 `LocalizedPool.usedLocation.label` 对齐（契约只分 gps / anchor 两种） */
  label: 'gps' | 'anchor';
  via: LocationVia;
  /** 按锚点算时是哪个锚点；GPS 档为 null */
  anchor: Anchor | null;
}

/**
 * 降级链：GPS → 上次成功位置 → 当前锚点 → 默认锚点。
 * **任何一环都不返回 null**，因为返回 null 的下游只能是空池子。
 *
 * 注意这个函数是同步的、不请求权限：它只读已经存下来的东西。
 * 「刚拿到的 GPS」由 `requestGps()` 写进 prefs，然后这里读到。
 */
export function resolveLocation(
  prefs: LocationPrefs = loadLocationPrefs(),
  now: number = Date.now(),
): ResolvedLocation {
  const { source, lastGps } = prefs;

  if (source?.kind === 'gps') {
    // 1) 15 分钟内的定位，直接用
    if (now - source.ts <= GPS_MAX_AGE_MS) {
      return { lat: source.lat, lng: source.lng, label: 'gps', via: 'gps', anchor: null };
    }
    // 2) 过期了：退到「上次成功位置」（可能就是同一点，也可能更新）
    const fallback = lastGps && lastGps.ts >= source.ts ? lastGps : { lat: source.lat, lng: source.lng };
    return { lat: fallback.lat, lng: fallback.lng, label: 'gps', via: 'lastGps', anchor: null };
  }

  // 用户明确选了锚点：即使有 lastGps 也不用 —— 那是他的选择
  if (source?.kind === 'anchor') {
    const anchor = findAnchor(source.id);
    return {
      lat: anchor?.lat ?? source.lat,
      lng: anchor?.lng ?? source.lng,
      label: 'anchor',
      via: 'anchor',
      anchor: anchor ?? { id: source.id, labelZh: source.id, labelEn: source.id, lat: source.lat, lng: source.lng },
    };
  }

  // 3) 什么都没设过：上次成功的 GPS 优先于默认锚点（用户至少用过一次定位）
  if (lastGps) {
    return { lat: lastGps.lat, lng: lastGps.lng, label: 'gps', via: 'lastGps', anchor: null };
  }

  // 4) 兜底：默认锚点 Downtown Markham
  return {
    lat: DEFAULT_ANCHOR.lat,
    lng: DEFAULT_ANCHOR.lng,
    label: 'anchor',
    via: 'defaultAnchor',
    anchor: DEFAULT_ANCHOR,
  };
}
