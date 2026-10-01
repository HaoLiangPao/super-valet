'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';

import { useLocale, useT } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

/**
 * 「我的」面板 —— 右上角头像点开的唯一设置入口（台账 Q17，Hao 2026-10-01 批准）。
 *
 * 之前设置分在两处：头像面板只有账号信息，语言/位置/半径在 `/settings`，
 * 而 `/settings` 不在底部导航里，几乎没人找得到。现在头像是唯一入口：
 *   1. 第一行是语言切换，双语标注 —— 看不懂中文的人第一次打开也认得出；
 *   2. 身份信息（由调用方传入：登录模式是邮箱/口味起点，游客模式是 Profile 名）；
 *   3. 「位置与半径 →」进 `/settings`（锚点列表长，留在独立页面）；
 *   4. 底部动作（登出 / 切换身份）。
 * 语言**只在这里**切，`/settings` 不再重复一份，免得两处状态不同步。
 */
export default function MeSheet({
  onClose,
  children,
  footer,
}: {
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel fx-sheet">
        <div className="sheet-grabber" />
        <div className="mb-4 font-heading text-[22px] leading-[1.2]">{t('me.sheet.title')}</div>

        <div className="mb-4 flex flex-col gap-2">
          <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{t('me.language.title')}</span>
          <div className="flex gap-1.5 rounded-[999px] p-1" style={{ background: 'var(--color-neutral-200)' }}>
            {(['zh', 'en'] as Locale[]).map((l) => {
              const active = locale === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  aria-pressed={active}
                  className="flex-1 rounded-full py-2 text-center text-[12px] font-bold"
                  style={{
                    background: active ? 'var(--color-accent)' : 'transparent',
                    color: active ? 'var(--color-bg)' : 'var(--color-neutral-700)',
                  }}
                >
                  {l === 'zh' ? t('settings.language.zh') : t('settings.language.en')}
                </button>
              );
            })}
          </div>
        </div>

        {children && <div className="mb-4 flex flex-col gap-2">{children}</div>}

        <Link
          href="/settings"
          onClick={onClose}
          className="mb-4 flex items-center justify-between rounded-[14px] px-4 py-3"
          style={{ border: '1px solid var(--color-divider)', background: 'var(--color-neutral-100)' }}
        >
          <span className="text-[14px] font-semibold">{t('me.locationEntry')}</span>
          <span aria-hidden="true" style={{ color: 'var(--color-accent-700)' }}>→</span>
        </Link>

        {footer}
      </div>
    </>
  );
}

/** 面板里「标签 —— 值」的一行 */
export function MeSheetRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>{label}</span>
      {children}
    </div>
  );
}
