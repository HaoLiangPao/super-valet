import { beforeEach, describe, expect, it } from 'vitest';

import { currentLocale, interpolate, resolveApiErrorMessage, translate } from '../src/lib/i18n';
import { en } from '../src/lib/i18n/messages.en';
import { zh } from '../src/lib/i18n/messages.zh';

/** vitest 跑在 node 环境，自带没有 localStorage —— 用 Map 装一个够用的 shim */
function createStorageShim(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
  } as Storage;
}

beforeEach(() => {
  globalThis.localStorage = createStorageShim();
});

describe('字典完整性', () => {
  it('中英字典 key 完全一致（不只靠类型，实跑 Object.keys 比对）', () => {
    const zhKeys = Object.keys(zh).sort();
    const enKeys = Object.keys(en).sort();
    expect(enKeys).toEqual(zhKeys);
  });

  it('两份字典都非空，且条目数一致', () => {
    expect(Object.keys(zh).length).toBeGreaterThan(0);
    expect(Object.keys(zh).length).toBe(Object.keys(en).length);
  });

  it('英文字典里没有中文字符（防漏翻）', () => {
    // 唯一允许的例外：语言切换里「简体中文」这个选项本身要用自己的文字显示，
    // 不管当前 UI 语言是什么（跟 settings.language.en 在中文字典里也是
    // "English" 而不是"英文"同理）。
    // 「我的」面板里语言那一行的标题刻意双语（Q17）：语言切换就是给看不懂
    // 当前语言的人用的，标题必须两种文字都有。
    const ALLOWED_CJK_KEYS = new Set(['settings.language.zh', 'me.language.title']);
    const cjk = /[一-鿿]/;
    const offenders = Object.entries(en)
      .filter(([key, value]) => !ALLOWED_CJK_KEYS.has(key) && cjk.test(value));
    expect(offenders).toEqual([]);
  });
});

describe('占位符替换', () => {
  it('替换单个变量', () => {
    expect(interpolate('上次的 {name} 怎么样？', { name: '海底捞' })).toBe('上次的 海底捞 怎么样？');
  });

  it('替换多个变量', () => {
    expect(interpolate('决策用了 {seconds} 秒，摇了 {rolls} 次', { seconds: 12, rolls: 2 }))
      .toBe('决策用了 12 秒，摇了 2 次');
  });

  it('没给 vars 时原样返回模板', () => {
    expect(interpolate('池子空空如也')).toBe('池子空空如也');
  });

  it('缺变量时不崩，占位符原样保留', () => {
    expect(() => interpolate('你好 {name}', {})).not.toThrow();
    expect(interpolate('你好 {name}', {})).toBe('你好 {name}');
  });

  it('translate() 按 locale 取值 + 替换', () => {
    expect(translate('zh', 'home.result.rollIndex', { n: 3 })).toBe('第 3 摇');
    expect(translate('en', 'home.result.rollIndex', { n: 3 })).toBe('Roll #3');
  });
});

describe('locale 持久化', () => {
  it('没存过时默认 zh', () => {
    expect(currentLocale()).toBe('zh');
  });

  it('localStorage 有合法值时用存的', () => {
    localStorage.setItem('sv.locale.v1', 'en');
    expect(currentLocale()).toBe('en');
  });

  it('localStorage 存的值不合法时回落默认 zh', () => {
    localStorage.setItem('sv.locale.v1', 'fr');
    expect(currentLocale()).toBe('zh');
  });
});

describe('服务端错误码解析（design/0007 §3/§4）', () => {
  it('有 code 且字典命中时优先用字典文案', () => {
    localStorage.setItem('sv.locale.v1', 'en');
    const msg = resolveApiErrorMessage('places.not_found', '服务端兜底中文');
    expect(msg).toBe(en['apiError.places.not_found']);
  });

  it('没给 code 时用服务端兜底文案', () => {
    expect(resolveApiErrorMessage(undefined, '服务端兜底中文')).toBe('服务端兜底中文');
  });

  it('code 在字典里查不到时也退回兜底文案', () => {
    expect(resolveApiErrorMessage('not.a.real.code', '服务端兜底中文')).toBe('服务端兜底中文');
  });
});
