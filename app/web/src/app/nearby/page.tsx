'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { swatchFor } from '@/components/cuisineSwatch';
import { radarScaleKm } from '@/components/nearby/geo';
import { loadReports, runRefresh, travelEstimate } from '@/components/nearby/dataSource';
import Radar, { buildRadarDot } from '@/components/nearby/Radar';
import type { RadarDot } from '@/components/nearby/Radar';
import NearbyList from '@/components/nearby/NearbyList';
import RefreshReportPanel from '@/components/nearby/RefreshReportPanel';
import { archiveRestaurant } from '@/lib/catalog/archive';
import { ANCHOR_LIST, loadLocationPrefs, radiusKm, saveLocationPrefs } from '@/lib/catalog/location';
import { localizedPool } from '@/lib/catalog/localize';
import { addToSelection, removeFromSelection } from '@/lib/catalog/selection';
import type { LocalizedPool, LocationPrefs, RadiusOption } from '@/lib/catalog/types';
import type { AttentionDecision, RefreshReport } from '@/lib/catalog/refresh-types';
import { importPreview } from '@/lib/store/pool';
import { categoryOf } from '@/lib/engine/cuisine';
import { useLocale, useT } from '@/lib/i18n';
import type { Locale, MessageKey, TFunc } from '@/lib/i18n';

/**
 * 雷达重扫 + 附近列表 + 刷新报告（design/0009 §4.1/4.3/4.5，S5）。
 *
 * 列表数据源纪律：唯一的过滤入口是 `localizedPool()`（与摇一摇同一个函数）。
 * 半径永远调 `localizedPool({ ...prefs, radius: 'ALL' })` 拿到「不限距离但已按
 * selection/归档过滤好、distanceKm 已重算」的全量结果，再用同一个谓词
 * `distanceKm < effectiveRadiusKm` 本地筛一遍——四档预设时 `effectiveRadiusKm`
 * 与 `radiusKm(prefs.radius)` 完全相同，结果与直接调 `localizedPool(prefs)`
 * 逐字节一致；自定义半径只是把同一个谓词的阈值换成用户输入的数字，
 * **不是另一套过滤逻辑**（上一轮事故：两套逻辑）。
 */

const RADIUS_ORDER: RadiusOption[] = ['WALK', 'NEAR', 'MID', 'ALL'];
const RADIUS_LABEL_KEY: Record<RadiusOption, MessageKey> = {
  WALK: 'settings.radius.walk',
  NEAR: 'settings.radius.near',
  MID: 'settings.radius.mid',
  ALL: 'settings.radius.all',
};

function anchorLabel(prefs: LocationPrefs, locale: Locale, t: TFunc): string {
  const source = prefs.source;
  const fallbackAnchor: (typeof ANCHOR_LIST)[number] | undefined = ANCHOR_LIST[0];
  const pick = (a: (typeof ANCHOR_LIST)[number] | undefined) => (locale === 'en' ? a?.labelEn : a?.labelZh);
  if (!source) return pick(fallbackAnchor) ?? t('pool.anchor.defaultFallback');
  if (source.kind === 'gps') return t('pool.anchor.gpsCurrent');
  const anchor = ANCHOR_LIST.find((a) => a.id === source.id);
  return pick(anchor) ?? t('pool.anchor.defaultFallback');
}

function formatReportMetaShort(report: RefreshReport, locale: Locale): string {
  const d = new Date(report.finishedAt);
  const label = locale === 'en' ? d.toLocaleString() : d.toLocaleString('zh-CN');
  return `${report.trigger === 'manual' ? (locale === 'en' ? 'Manual' : '手动') : (locale === 'en' ? 'Auto' : '自动')} · ${label}`;
}

export default function NearbyPage() {
  const t = useT();
  const { locale } = useLocale();

  const [prefs, setPrefs] = useState<LocationPrefs | null>(null);
  const [basePool, setBasePool] = useState<LocalizedPool | null>(null);
  const [customKm, setCustomKm] = useState<number | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [reports, setReports] = useState<RefreshReport[] | null>(null);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [decidedAttention, setDecidedAttention] = useState<Map<string, AttentionDecision>>(new Map());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [nowInfo, setNowInfo] = useState<{ weekday: number; minutes: number } | null>(null);

  // 挂载时一次性拉状态；microtask 延后 setState 规避 react-compiler 对
  // 「effect 里直接 setState」的判定（CLAUDE.md §7）。
  useEffect(() => {
    Promise.resolve().then(() => {
      const p = loadLocationPrefs();
      setPrefs(p);
      setBasePool(localizedPool({ ...p, radius: 'ALL' }));
      setReports(loadReports());
    });
  }, []);

  // 当前是否白天/夜间、周几——用于「营业中/已打烊」徽标；new Date() 只在
  // tick() 里读，不在渲染体内直接调用（同 ClockBadge 的写法）。
  useEffect(() => {
    function tick() {
      const now = new Date();
      setNowInfo({ weekday: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() });
    }
    const id = setInterval(tick, 30_000);
    Promise.resolve().then(tick);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    Promise.resolve().then(() => setReducedMotion(mq.matches));
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!prefs || !basePool || !reports) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">{t('common.loading')}</div>
    );
  }

  const effectiveRadiusKm = customKm ?? radiusKm(prefs.radius);
  const unlimited = !Number.isFinite(effectiveRadiusKm);
  const visibleRestaurants = unlimited
    ? basePool.restaurants
    : basePool.restaurants.filter((r) => r.distanceKm < effectiveRadiusKm);
  const filteredOutCount = basePool.restaurants.length - visibleRestaurants.length;

  const latestReport = reports[0] ?? null;
  const poolPlaceIdSet = new Set(basePool.restaurants.map((r) => r.placeId));
  const pendingDiscovered = latestReport
    ? latestReport.discovered.filter((d) => !poolPlaceIdSet.has(d.restaurant.placeId))
    : [];
  const addedDiscoveredIds = new Set(
    (latestReport?.discovered ?? []).map((d) => d.restaurant.placeId).filter((id) => poolPlaceIdSet.has(id)),
  );

  const poolDots: RadarDot[] = visibleRestaurants.map((r) => buildRadarDot(
    basePool.usedLocation,
    { lat: r.lat, lng: r.lng, placeId: r.placeId, name: r.name, distanceKm: r.distanceKm },
    swatchFor(categoryOf(r)).bg,
    'pool',
  ));
  const discoveredDots: RadarDot[] = pendingDiscovered.map((d) => buildRadarDot(
    basePool.usedLocation,
    {
      lat: d.restaurant.lat,
      lng: d.restaurant.lng,
      placeId: d.restaurant.placeId,
      name: d.restaurant.name,
      distanceKm: d.distanceKm,
    },
    'var(--color-accent-700)',
    'discovered',
  ));
  const allDots = [...poolDots, ...discoveredDots];
  const observedMax = allDots.length > 0 ? Math.max(...allDots.map((d) => d.distanceKm)) : 5;
  const scaleKm = radarScaleKm(effectiveRadiusKm, observedMax);

  const displayedReport = historyIndex !== null ? reports[historyIndex + 1] ?? null : latestReport;
  const isViewingHistory = historyIndex !== null;

  function refreshPoolView(nextPrefs: LocationPrefs) {
    setBasePool(localizedPool({ ...nextPrefs, radius: 'ALL' }));
  }

  function pickPreset(opt: RadiusOption) {
    if (!prefs) return;
    setCustomKm(null);
    setCustomInput('');
    setCustomError(null);
    const next = saveLocationPrefs({ ...prefs, radius: opt });
    setPrefs(next);
    refreshPoolView(next);
  }

  function applyCustom() {
    const n = Number(customInput);
    if (!Number.isFinite(n) || n < 1 || n > 50) {
      setCustomError(t('nearby.radius.customInvalid'));
      return;
    }
    setCustomError(null);
    setCustomKm(n);
  }

  function widenRange() {
    pickPreset('ALL');
  }

  async function handleRescan() {
    if (!prefs) return;
    setScanning(true);
    setScanError(null);
    try {
      // 自定义半径是本页的会话内视图过滤（不写回 LocationPrefs.radius，见文件顶部
      // 注释），但「新发现」这一步理应尊重用户此刻实际看到的范围，所以显式传
      // withinKm；不限（Infinity）时不传，让引擎退回 prefs.radius 的默认值。
      const report = await runRefresh('manual', unlimited ? {} : { withinKm: effectiveRadiusKm });
      setReports((prev) => [report, ...(prev ?? [])]);
      setDecidedAttention(new Map());
      setHistoryIndex(null);
      setHistoryOpen(false);
      refreshPoolView(prefs);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : t('nearby.rescan.error'));
    } finally {
      setScanning(false);
    }
  }

  function handleAddDiscovered(placeIds: string[]) {
    if (placeIds.length === 0 || !prefs) return;
    // 「新发现」在被确认之前只活在这次的 RefreshReport 里，目录（catalogIndex）
    // 并不认识它——只调 addToSelection 只是往 selection 里塞一个查无此店的
    // placeId，localizedPool() 会因为 catalogIndex().get(placeId) 落空而静默
    // 丢弃它（Playwright 走查发现的真实问题）。真正的写入路径是 importPreview()
    // （`src/lib/store/pool.ts`）：把完整的 CatalogRestaurant 事实落进「导入的
    // 餐厅」存储，这样 catalog.ts 的 catalogIndex() 才认得它。
    for (const placeId of placeIds) {
      const candidate = latestReport?.discovered.find((d) => d.restaurant.placeId === placeId);
      if (!candidate) continue;
      importPreview({
        restaurant: candidate.restaurant,
        fetchedAt: new Date().toISOString(),
        summary: '附近雷达重扫时的新发现',
        dishes: [],
        alreadyInPool: false,
        demo: false,
      });
    }
    addToSelection(placeIds);
    refreshPoolView(prefs);
  }

  function handleAttentionDecision(placeId: string, decision: AttentionDecision) {
    if (!prefs) return;
    if (decision === 'archive') {
      const item = latestReport?.needsAttention.find((a) => a.placeId === placeId);
      archiveRestaurant(placeId, item?.suggestedReason);
    } else if (decision === 'remove') {
      removeFromSelection(placeId);
    }
    setDecidedAttention((prev) => {
      const next = new Map(prev);
      next.set(placeId, decision);
      return next;
    });
    refreshPoolView(prefs);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-3">
      <p className="px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
        {t('pool.distanceBasedOn', { anchor: anchorLabel(prefs, locale, t) })}
        {' '}
        <Link href="/settings" style={{ color: 'var(--color-accent-700)', fontWeight: 700 }}>
          {t('pool.changeAnchor')}
        </Link>
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-[15px]">{t('nearby.radius.title')}</h2>
        <div className="flex gap-1.5 rounded-[999px] p-1" style={{ background: 'var(--color-neutral-200)' }}>
          {RADIUS_ORDER.map((opt) => {
            const active = customKm === null && prefs.radius === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => pickPreset(opt)}
                className="flex-1 rounded-full py-2 text-center text-[12px] font-bold"
                style={{
                  background: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? 'var(--color-bg)' : 'var(--color-neutral-700)',
                }}
              >
                {t(RADIUS_LABEL_KEY[opt])}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input"
            inputMode="numeric"
            placeholder={t('nearby.radius.customPlaceholder')}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            style={{ flex: 1 }}
            aria-label={t('nearby.radius.custom')}
          />
          <button type="button" className="btn btn-secondary" style={{ height: 44 }} onClick={applyCustom}>
            {t('nearby.radius.customApply')}
          </button>
        </div>
        {customKm !== null && (
          <p className="fx-pop px-1 text-[11.5px]" style={{ color: 'var(--color-accent-700)' }}>
            {t('nearby.radius.customActive', { km: customKm })}
          </p>
        )}
        {customError && (
          <p className="fx-pop px-1 text-[11.5px]" style={{ color: 'var(--color-accent-700)' }}>
            {customError}
          </p>
        )}
      </section>

      <section className="flex flex-col items-center gap-2">
        {allDots.length === 0 ? (
          <p className="py-8 text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>
            {t('nearby.radar.empty')}
          </p>
        ) : (
          <Radar
            dots={allDots}
            scaleKm={scaleKm}
            scanning={scanning}
            reducedMotion={reducedMotion}
            selectedPlaceId={selectedPlaceId}
            onSelect={setSelectedPlaceId}
            northLabel={t('nearby.radar.north')}
            youLabel={t('nearby.radar.you')}
          />
        )}
        {scanning && reducedMotion && (
          <p className="text-[12px] font-bold" style={{ color: 'var(--color-accent-700)' }}>
            {t('nearby.radar.scanning')}
          </p>
        )}
        <div className="flex gap-4 text-[10.5px]" style={{ color: 'var(--color-neutral-600)' }}>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent-500)' }} />
            {t('nearby.radar.legendPool')}
          </span>
          {discoveredDots.length > 0 && (
            <span className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ border: '1.4px dashed var(--color-accent-700)', background: 'var(--color-bg)' }}
              />
              {t('nearby.radar.legendDiscovered')}
            </span>
          )}
        </div>
      </section>

      {filteredOutCount > 0 && (
        <p className="fx-rise px-1 text-center text-[11.5px] leading-relaxed" style={{ color: 'var(--color-accent-700)' }}>
          {t('nearby.list.filteredOutHint', { count: filteredOutCount })}
          {' '}
          <button type="button" onClick={widenRange} style={{ fontWeight: 700, textDecoration: 'underline' }}>
            {t('nearby.list.widen')}
          </button>
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-[15px]">{t('nearby.list.title')}</h2>
        <NearbyList
          restaurants={visibleRestaurants}
          nowInfo={nowInfo}
          selectedPlaceId={selectedPlaceId}
          onSelect={setSelectedPlaceId}
          travelEstimate={travelEstimate}
        />
      </section>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void handleRescan()}
          disabled={scanning}
          className="btn btn-primary btn-block"
          style={{ height: 48 }}
        >
          {scanning ? t('nearby.rescan.scanning') : t('nearby.rescan.button')}
        </button>
        {scanError && (
          <p className="fx-pop text-center text-[12px]" style={{ color: 'var(--color-accent-700)' }}>
            {scanError}
          </p>
        )}

        {!displayedReport ? (
          <p className="text-center text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>
            {t('nearby.report.empty')}
          </p>
        ) : (
          <>
            <h2 className="font-heading text-[15px]">{t('nearby.report.title')}</h2>
            <RefreshReportPanel
              report={displayedReport}
              addedDiscoveredIds={addedDiscoveredIds}
              onAddDiscovered={handleAddDiscovered}
              decidedAttention={decidedAttention}
              onAttentionDecision={handleAttentionDecision}
              interactive={!isViewingHistory}
            />
            {isViewingHistory ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setHistoryIndex(null)}
              >
                {t('nearby.report.backToLatest')}
              </button>
            ) : (
              reports.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setHistoryOpen((o) => !o)}
                >
                  {t('nearby.report.viewHistory')}
                </button>
              )
            )}
            {historyOpen && !isViewingHistory && (
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[12.5px] font-bold" style={{ color: 'var(--color-neutral-700)' }}>
                  {t('nearby.report.historyTitle')}
                </h3>
                {reports.length <= 1 ? (
                  <p className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>
                    {t('nearby.report.historyEmpty')}
                  </p>
                ) : (
                  reports.slice(1).map((r, i) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setHistoryIndex(i)}
                      className="rounded-[10px] px-3 py-2 text-left text-[12px]"
                      style={{ background: 'var(--color-neutral-200)' }}
                    >
                      {formatReportMetaShort(r, locale)}
                    </button>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
