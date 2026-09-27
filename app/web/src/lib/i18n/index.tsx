'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import type { ReactNode } from 'react';

import { CATEGORY_LABELS_EN } from './categories';
import { en } from './messages.en';
import { zh } from './messages.zh';
import type { MessageKey } from './messages.zh';

export type { MessageKey } from './messages.zh';

/**
 * 语言支持（design/0007）。默认简体中文，**不读 `navigator.language`**——
 * GTA 地区浏览器多为 en-CA，会把中文用户默认到英文（design/0007 §5）。
 * 语言存 localStorage 的全局 key，与 Profile/账号身份无关（换账号不换语言）。
 */
export type Locale = 'zh' | 'en';

const LOCALE_KEY = 'sv.locale.v1';
const DEFAULT_LOCALE: Locale = 'zh';

const DICTS: Record<Locale, Record<MessageKey, string>> = { zh, en };

function isLocale(v: unknown): v is Locale {
  return v === 'zh' || v === 'en';
}

/** 读存下来的语言；没存过 / 存的值不合法 / 环境没有 localStorage 一律回落默认 */
function readStoredLocale(): Locale {
  try {
    const raw = localStorage.getItem(LOCALE_KEY);
    return isLocale(raw) ? raw : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // 存不进去（隐私模式等）就只在当前会话生效，不影响主流程
  }
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
});

/**
 * 全局语言 Provider，包在根布局最外层。
 *
 * 首屏先用默认值 `zh` 渲染（避免 SSR/hydration 不一致），挂载后的 effect
 * 里才去读 localStorage —— 用微任务延后 setState，规避 React Compiler 对
 * 「effect 主体内直接 setState」的判定（CLAUDE.md §7，沿用 `page.tsx` 的写法）。
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    Promise.resolve().then(() => {
      const stored = readStoredLocale();
      if (stored !== DEFAULT_LOCALE) setLocaleState(stored);
    });
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

export type Vars = Record<string, string | number>;

/** `{name}` 占位符替换；没给变量的 key 原样返回，缺变量的占位符原样保留 */
export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

/** 不依赖 React context 的纯函数版本，`useT()` 与测试都基于它 */
export function translate(locale: Locale, key: MessageKey, vars?: Vars): string {
  return interpolate(DICTS[locale][key], vars);
}

export type TFunc = (key: MessageKey, vars?: Vars) => string;

/** `t('pool.remove.confirm', { name })`：取当前语言的字典值 + 占位符替换 */
export function useT(): TFunc {
  const { locale } = useLocale();
  return useCallback<TFunc>((key, vars) => translate(locale, key, vars), [locale]);
}

/**
 * 菜系类别的展示名——中文用引擎里 `CATEGORY_LABELS`，英文用这份对照表；
 * 两边都查不到就原样返回 code（兜底，不会崩）。
 */
export function categoryLabel(
  category: string,
  locale: Locale,
  zhLabels: Record<string, string>,
): string {
  if (locale === 'en') return CATEGORY_LABELS_EN[category] ?? zhLabels[category] ?? category;
  return zhLabels[category] ?? category;
}

/**
 * `exploreClient.ts` 不是组件/hook，拿不到 React context，
 * 直接读 localStorage 取当前语言——与 `LocaleProvider` 同一份真理源。
 */
export function currentLocale(): Locale {
  return readStoredLocale();
}

/**
 * 服务端错误码 → 客户端字典兜底（design/0007 §3、§4）。
 * 查不到 code 对应的字典项（没设 code，或字典没这个 key）就用服务端自带的
 * 中文 `fallback`——那句中文永远是能显示的最终兜底。
 */
export function resolveApiErrorMessage(code: string | undefined, fallback: string): string {
  if (!code) return fallback;
  const dict = DICTS[currentLocale()] as Record<string, string>;
  return dict[`apiError.${code}`] ?? fallback;
}

/**
 * persona 模板名（`lib/profiles/personas.ts` 的 `PERSONA_TEMPLATES`）——
 * 该文件不在本轮改动范围内，只有中文 `name` 字段，所以英文对照建在字典里，
 * key 固定是 `persona.template.<templateKey>`；未知 key 时兜底传入的中文原名。
 */
export function personaTemplateLabel(t: TFunc, templateKey: string, fallbackName: string): string {
  const key = `persona.template.${templateKey}`;
  return key in zh ? t(key as MessageKey) : fallbackName;
}
