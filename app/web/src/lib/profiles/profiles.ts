import { PERSONA_TEMPLATES, personaSeedState } from './personas';

/** 同设备上的一个独立「人」；数据按 id 命名空间完全隔离（design/0004 §4） */
export interface Profile {
  id: string;
  name: string;
  emoji: string;
  /** 预置 persona 的模板 key（自定义 Profile 没有） */
  personaKey?: string;
  createdAt: string;
}

export const PROFILES_KEY = 'sv.profiles.v1';
export const ACTIVE_KEY = 'sv.activeProfile.v1';

/** 一个 Profile 名下的全部数据 key 后缀；将来新增数据类型必须登记在这里 */
export const DATA_SUFFIXES = ['state.v1', 'rolls.v1', 'feedbacks.v1', 'pool.v1', 'fetchlog.v1'] as const;
export type DataSuffix = (typeof DATA_SUFFIXES)[number];

/** P0 的单用户全局 key，只在迁移时出现一次 */
export const LEGACY_KEYS: Record<DataSuffix, string> = {
  'state.v1': 'sv.state.v1',
  'rolls.v1': 'sv.rolls.v1',
  'feedbacks.v1': 'sv.feedbacks.v1',
  // 'pool.v1' 是账号轮之后才有的数据类型，P0 时代不存在全局 key；
  // 保留一个不会命中的名字，只为让 Record<DataSuffix, string> 保持完整。
  'pool.v1': 'sv.pool.v1',
  'fetchlog.v1': 'sv.fetchlog.v1',
};

export function profileKey(profileId: string, suffix: DataSuffix): string {
  return `sv.${profileId}.${suffix}`;
}

function storage(): Storage | null {
  try {
    // SSR / 隐私模式下没有 localStorage，整层退化为「无 Profile」
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readRaw(key: string): string | null {
  const ls = storage();
  if (!ls) return null;
  try {
    return ls.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, raw: string): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(key, raw);
  } catch {
    // 配额满 / 隐私模式：当内存态跑，不让 UI 崩
  }
}

function removeRaw(key: string): void {
  const ls = storage();
  if (!ls) return;
  try {
    ls.removeItem(key);
  } catch {
    // 同上
  }
}

function isProfile(v: unknown): v is Profile {
  if (typeof v !== 'object' || v === null) return false;
  const p = v as Partial<Profile>;
  return typeof p.id === 'string' && typeof p.name === 'string' && typeof p.emoji === 'string';
}

function parseProfiles(raw: string | null): Profile[] | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isProfile);
  } catch {
    return null;
  }
}

export function listProfiles(): Profile[] {
  return parseProfiles(readRaw(PROFILES_KEY)) ?? [];
}

function writeProfiles(profiles: Profile[]): void {
  writeRaw(PROFILES_KEY, JSON.stringify(profiles));
}

function newProfileId(prefix: string): string {
  const existing = new Set(listProfiles().map((p) => p.id));
  for (;;) {
    // '.' 会破坏 `sv.<id>.<suffix>` 的可解析性，所以只用 base36 与连字符
    const id = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    if (!existing.has(id)) return id;
  }
}

export function createProfile(name: string, emoji: string, personaKey?: string): Profile {
  const seed = personaKey ? personaSeedState(personaKey) : null;
  const profile: Profile = {
    id: newProfileId(seed ? personaKey! : 'p'),
    name,
    emoji,
    ...(seed ? { personaKey } : {}),
    createdAt: new Date().toISOString(),
  };
  writeProfiles([...listProfiles(), profile]);
  if (seed) writeRaw(profileKey(profile.id, 'state.v1'), JSON.stringify(seed));
  return profile;
}

/** 活跃 id；注册表里已经没有这个 id（别的标签页删了）时按「没选人」处理 */
export function getActiveProfileId(): string | null {
  const id = readRaw(ACTIVE_KEY);
  if (!id) return null;
  return listProfiles().some((p) => p.id === id) ? id : null;
}

export function getActiveProfile(): Profile | null {
  const id = getActiveProfileId();
  return id ? (listProfiles().find((p) => p.id === id) ?? null) : null;
}

/** 传 null = 退回选人页（数据保留） */
export function setActiveProfile(id: string | null): void {
  if (id === null) removeRaw(ACTIVE_KEY);
  else writeRaw(ACTIVE_KEY, id);
}

/** 删 Profile = 删注册表条目 + 抹掉 `sv.<id>.` 下的所有 key（不可撤销） */
export function deleteProfile(id: string): void {
  writeProfiles(listProfiles().filter((p) => p.id !== id));
  for (const suffix of DATA_SUFFIXES) removeRaw(profileKey(id, suffix));

  // 兜底：扫一遍前缀，捞掉登记表之外的历史 key
  const ls = storage();
  if (ls) {
    try {
      const prefix = `sv.${id}.`;
      for (let i = ls.length - 1; i >= 0; i--) {
        const k = ls.key(i);
        if (k && k.startsWith(prefix)) ls.removeItem(k);
      }
    } catch {
      // 忽略
    }
  }

  if (readRaw(ACTIVE_KEY) === id) removeRaw(ACTIVE_KEY);
}

/**
 * 首次进入时建立 Profile 体系。幂等。
 *
 * a) 已有注册表 → 什么都不做；
 * b) 没有注册表但有 P0 的全局 key → 建「默认」🍚，把旧 key 平移过去（数据一条不丢），设为活跃；
 * c) 全新设备 → 预置三个 persona，**不设活跃**，让用户在选人页自己挑。
 */
export function ensureBootstrapped(): void {
  if (!storage()) return;
  if (parseProfiles(readRaw(PROFILES_KEY)) !== null) return;

  const legacy = DATA_SUFFIXES.filter((s) => readRaw(LEGACY_KEYS[s]) !== null);
  if (legacy.length > 0) {
    const profile = createProfile('默认', '🍚');
    for (const suffix of legacy) {
      const raw = readRaw(LEGACY_KEYS[suffix]);
      if (raw !== null) {
        writeRaw(profileKey(profile.id, suffix), raw);
        removeRaw(LEGACY_KEYS[suffix]);
      }
    }
    setActiveProfile(profile.id);
    return;
  }

  for (const t of PERSONA_TEMPLATES) createProfile(t.name, t.emoji, t.key);
}
