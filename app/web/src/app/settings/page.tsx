'use client';

import { useEffect, useState } from 'react';

import type { GpsFailure } from '@/lib/catalog/location';
import { ANCHOR_LIST, loadLocationPrefs, requestGps, saveLocationPrefs } from '@/lib/catalog/location';
import { localizedPool } from '@/lib/catalog/localize';
import { RADIUS_KM } from '@/lib/catalog/types';
import type { LocationPrefs, RadiusOption } from '@/lib/catalog/types';

const GPS_FAILURE_LABEL: Record<GpsFailure, string> = {
  unsupported: '这台设备不支持定位',
  denied: '定位权限被拒绝',
  unavailable: '定位暂时不可用',
  timeout: '定位超时',
};

const RADIUS_ORDER: RadiusOption[] = ['WALK', 'NEAR', 'MID', 'ALL'];
const RADIUS_LABEL: Record<RadiusOption, string> = {
  WALK: '步行可达',
  NEAR: '顺路',
  MID: '专程',
  ALL: '不限',
};

function radiusKmLabel(opt: RadiusOption): string {
  const km = RADIUS_KM[opt];
  return Number.isFinite(km) ? `${km}km` : '不限';
}

/** source 为 null（用户从没设置过）时降级链落在默认锚点，选中态也照此高亮 */
function currentAnchorId(prefs: LocationPrefs): string | null {
  if (prefs.source?.kind === 'anchor') return prefs.source.id;
  if (prefs.source === null) return ANCHOR_LIST[0]?.id ?? null;
  return null;
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<LocationPrefs | null>(null);
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // 挂载时拉一次偏好 + 池子统计；microtask 延后 setState 规避 react-compiler
  // 对「effect 里直接 setState」的判定（CLAUDE.md §7）。
  useEffect(() => {
    Promise.resolve().then(() => {
      setPrefs(loadLocationPrefs());
      setPoolCount(localizedPool().restaurants.length);
    });
  }, []);

  if (!prefs || poolCount === null) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
    );
  }

  function persist(next: LocationPrefs) {
    saveLocationPrefs(next);
    setPrefs(next);
    setPoolCount(localizedPool().restaurants.length);
  }

  function pickAnchor(id: string) {
    if (!prefs) return;
    const anchor = ANCHOR_LIST.find((a) => a.id === id);
    if (!anchor) return;
    setGpsError(null);
    persist({ ...prefs, source: { kind: 'anchor', id: anchor.id, lat: anchor.lat, lng: anchor.lng } });
  }

  function pickRadius(opt: RadiusOption) {
    if (!prefs) return;
    persist({ ...prefs, radius: opt });
  }

  async function handleUseGps() {
    setGpsLoading(true);
    setGpsError(null);
    // requestGps() 从不 reject：成功时已经自己把 prefs 存好了，直接采信它返回的
    // prefs 即可；失败时「一个字都不改」（location.ts 的注释），沿用当前偏好。
    const result = await requestGps();
    if (result.ok) {
      setPrefs(result.prefs);
      setPoolCount(localizedPool().restaurants.length);
    } else {
      setGpsError(`${GPS_FAILURE_LABEL[result.reason]}，继续使用你选择的锚点`);
    }
    setGpsLoading(false);
  }

  const selectedAnchorId = currentAnchorId(prefs);
  const usingGps = prefs.source?.kind === 'gps';

  return (
    <div className="flex flex-1 flex-col gap-4 pb-3">
      <section className="flex flex-col gap-2.5">
        <h2 className="font-heading text-[16px]">位置</h2>

        <button
          type="button"
          onClick={() => void handleUseGps()}
          disabled={gpsLoading}
          className="btn btn-block"
          style={{
            height: 46,
            border: usingGps ? '1px solid var(--color-accent)' : '1px solid var(--color-divider)',
            background: usingGps ? 'var(--color-accent-100)' : 'var(--color-neutral-200)',
            color: usingGps ? 'var(--color-accent-800)' : 'var(--color-text)',
          }}
        >
          {gpsLoading ? '定位中…' : usingGps ? '✓ 用我当前位置' : '用我当前位置'}
        </button>
        {gpsError && (
          <p className="fx-pop text-[12px] leading-relaxed" style={{ color: 'var(--color-accent-700)' }}>
            {gpsError}
          </p>
        )}

        <div className="flex flex-col gap-2">
          {ANCHOR_LIST.map((a) => {
            const active = !usingGps && selectedAnchorId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => pickAnchor(a.id)}
                className="flex items-center justify-between rounded-[14px] px-4 py-3 text-left"
                style={{
                  border: active ? '1px solid var(--color-accent)' : '1px solid var(--color-divider)',
                  background: active ? 'var(--color-accent-100)' : 'var(--color-neutral-100)',
                }}
              >
                <span>
                  <span className="block text-[14px] font-semibold">{a.labelZh}</span>
                  <span className="block text-[11px]" style={{ color: 'var(--color-neutral-500)' }}>
                    {a.labelEn}
                  </span>
                </span>
                {active && <span style={{ color: 'var(--color-accent-700)' }}>●</span>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="font-heading text-[16px]">半径</h2>
        <div className="flex gap-1.5 rounded-[999px] p-1" style={{ background: 'var(--color-neutral-200)' }}>
          {RADIUS_ORDER.map((opt) => {
            const active = prefs.radius === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pickRadius(opt)}
                className="flex-1 rounded-full py-2 text-center text-[12px] font-bold"
                style={{
                  background: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? 'var(--color-bg)' : 'var(--color-neutral-700)',
                }}
              >
                {RADIUS_LABEL[opt]}
                <span className="mt-0.5 block" style={{ fontSize: 10, fontWeight: 400, opacity: 0.85 }}>
                  {radiusKmLabel(opt)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="px-1 text-[12px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          当前池子 {poolCount} 家可选。
        </p>
      </section>

      <section
        className="flex flex-col gap-2 rounded-[16px] p-4"
        style={{ background: 'var(--color-neutral-100)', border: '1px dashed var(--color-neutral-400)' }}
      >
        <h2 className="font-heading text-[15px]">语言</h2>
        <p className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>即将支持</p>
      </section>
    </div>
  );
}
