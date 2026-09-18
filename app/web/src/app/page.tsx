'use client';

import { useEffect, useRef, useState } from 'react';

import { swatchFor } from '@/components/cuisineSwatch';
import { SEED_RESTAURANTS } from '@/data/seed-restaurants';
import { CATEGORY_LABELS, categoryOf } from '@/lib/engine/cuisine';
import { reasonLine, rollOnce } from '@/lib/engine/engine';
import type { RollResult } from '@/lib/engine/engine';
import { applyFeedback, applySkip, markEaten } from '@/lib/engine/posterior';
import {
  appendFeedback,
  appendRoll,
  loadFeedbacks,
  loadRolls,
  loadState,
  newId,
  saveState,
} from '@/lib/engine/store';
import { DINNER, epochDay } from '@/lib/engine/types';
import type {
  CandidateSnapshot,
  EngineState,
  Restaurant,
  RollRecord,
  SkipReason,
} from '@/lib/engine/types';

type Phase =
  | 'loading'
  | 'feedback'
  | 'locked'
  | 'idle'
  | 'rolling'
  | 'result'
  | 'downgrade'
  | 'empty';

/** 翻牌动效时长，对齐 globals.css 里 ctwFlip 的 1.25s */
const REVEAL_MS = 1250;

const SKIP_CHIPS: { reason: SkipReason; label: string }[] = [
  { reason: 'too_far', label: '太远了' },
  { reason: 'too_pricey', label: '太贵了' },
  { reason: 'just_ate', label: '刚吃过' },
  { reason: 'wrong_cuisine', label: '不想吃这个菜系' },
  { reason: 'closed', label: '关门了' },
  { reason: 'no_mood', label: '就是不想吃' },
];

function findRestaurant(placeId: string): Restaurant | undefined {
  return SEED_RESTAURANTS.find((r) => r.placeId === placeId);
}

function categoryLabel(r: Restaurant): string {
  const cat = categoryOf(r);
  return CATEGORY_LABELS[cat] ?? cat;
}

function mapsUrlFor(name: string, address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${name} ${address}`,
  )}`;
}

/** 只在事件回调里读浏览器媒体状态，不在渲染体内调用 */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function computeRoll(
  currentState: EngineState,
  exclude: Set<string>,
): RollResult | null {
  const today = epochDay();
  const weekday = new Date().getDay();
  return rollOnce(SEED_RESTAURANTS, currentState, DINNER, today, weekday, exclude);
}

function RestaurantFacts({ r, inverted = false }: { r: Restaurant; inverted?: boolean }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
      style={{ color: inverted ? 'inherit' : 'var(--color-neutral-700)', opacity: inverted ? 0.9 : 1 }}
    >
      <span>
        ★ {r.rating.toFixed(1)}（{r.ratingCount}）
      </span>
      {r.priceLevel != null && <span>{'$'.repeat(r.priceLevel)}</span>}
      <span>{r.distanceKm} km</span>
    </div>
  );
}

function ReasonSheet({
  onPick,
  onClose,
}: {
  onPick: (reason: SkipReason) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet-panel fx-sheet">
        <div className="sheet-grabber" />
        <div className="font-heading text-[22px] leading-[1.2]">哪儿不对？</div>
        <p className="mt-1.5 mb-4 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
          一次多余的点击，换六个干净的特征。不说也行，直接换。
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {SKIP_CHIPS.map((opt) => (
            <button key={opt.reason} type="button" onClick={() => onPick(opt.reason)} className="chip">
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPick('other')}
          className="btn btn-secondary btn-block"
          style={{ height: 46 }}
        >
          不说，直接换一个
        </button>
      </div>
    </>
  );
}

export default function HomePage() {
  const [state, setState] = useState<EngineState | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');

  const [feedbackQueue, setFeedbackQueue] = useState<RollRecord[]>([]);
  const [lockedRoll, setLockedRoll] = useState<RollRecord | null>(null);
  const [justAccepted, setJustAccepted] = useState<{ seconds: number; rolls: number } | null>(
    null,
  );

  const [currentCard, setCurrentCard] = useState<RollResult | null>(null);
  const [currentRollIndex, setCurrentRollIndex] = useState(0);
  const [rollCount, setRollCount] = useState(0);
  const [excludeIds, setExcludeIds] = useState<Set<string>>(new Set());
  const [skipCount, setSkipCount] = useState(0);
  const [rollStartAt, setRollStartAt] = useState<number | null>(null);
  const [downgradeSnapshot, setDowngradeSnapshot] = useState<CandidateSnapshot[] | null>(null);
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);

  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 挂载时依次判断：补问反馈 → 今日是否已锁定 → 待摇。
  // localStorage 只在浏览器里有，效果里用微任务延后 setState，
  // 避免把「读取外部状态」写成在 effect 主体里直接同步 setState。
  useEffect(() => {
    Promise.resolve().then(() => {
      const st = loadState();
      const rolls = loadRolls();
      const feedbacks = loadFeedbacks();
      const today = epochDay();
      const pending = rolls.filter(
        (r) => r.action === 'accepted' && r.epochDay < today
          && !feedbacks.some((f) => f.rollId === r.id),
      );

      setState(st);
      if (pending.length > 0) {
        setFeedbackQueue(pending);
        setPhase('feedback');
        return;
      }
      const acceptedToday = rolls.filter(
        (r) => r.action === 'accepted' && r.epochDay === today,
      );
      if (acceptedToday.length > 0) {
        setLockedRoll(acceptedToday[acceptedToday.length - 1]);
        setPhase('locked');
      } else {
        setPhase('idle');
      }
    });
  }, []);

  // 卸载时清掉还没触发的翻牌计时器，避免对已卸载组件 setState
  useEffect(() => () => {
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
  }, []);

  function settleLockOrIdle() {
    const rolls = loadRolls();
    const today = epochDay();
    const acceptedToday = rolls.filter(
      (r) => r.action === 'accepted' && r.epochDay === today,
    );
    if (acceptedToday.length > 0) {
      setLockedRoll(acceptedToday[acceptedToday.length - 1]);
      setPhase('locked');
    } else {
      setPhase('idle');
    }
  }

  function advanceFeedback() {
    const next = feedbackQueue.slice(1);
    setFeedbackQueue(next);
    if (next.length === 0) settleLockOrIdle();
  }

  function handleFeedback(rating: 'good' | 'ok' | 'bad') {
    if (!state) return;
    const roll = feedbackQueue[0];
    const restaurant = findRestaurant(roll.restaurantId);
    appendFeedback({
      rollId: roll.id,
      restaurantId: roll.restaurantId,
      rating,
      createdAt: new Date().toISOString(),
    });
    if (restaurant) {
      const next = structuredClone(state);
      applyFeedback(next, restaurant, rating);
      saveState(next);
      setState(next);
    }
    advanceFeedback();
  }

  function handleNoShow() {
    const roll = feedbackQueue[0];
    appendFeedback({
      rollId: roll.id,
      restaurantId: roll.restaurantId,
      rating: 'ok',
      note: '没去成',
      createdAt: new Date().toISOString(),
    });
    advanceFeedback();
  }

  function resetSession() {
    setCurrentCard(null);
    setDowngradeSnapshot(null);
    setExcludeIds(new Set());
    setSkipCount(0);
    setRollCount(0);
    setRollStartAt(null);
    setReasonSheetOpen(false);
  }

  /** 摇一次：立刻算出结果，但先进入 rolling 播翻牌动效，动效播完才把 phase 切到 result */
  function beginRoll(currentState: EngineState, exclude: Set<string>) {
    const idx = rollCount;
    const result = computeRoll(currentState, exclude);
    setRollCount(idx + 1);
    setCurrentRollIndex(idx);
    setExcludeIds(exclude);
    if (!result) {
      setCurrentCard(null);
      setPhase('empty');
      return;
    }
    setCurrentCard(result);
    setPhase('rolling');
    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    const delay = prefersReducedMotion() ? 0 : REVEAL_MS;
    rollTimerRef.current = setTimeout(() => setPhase('result'), delay);
  }

  function performDowngrade(currentState: EngineState, exclude: Set<string>) {
    const idx = rollCount;
    const result = computeRoll(currentState, exclude);
    setRollCount(idx + 1);
    setCurrentRollIndex(idx);
    setExcludeIds(exclude);
    if (!result) {
      setPhase('empty');
      return;
    }
    setDowngradeSnapshot(result.snapshot);
    setPhase('downgrade');
  }

  function handleStartRoll() {
    if (!state) return;
    setRollStartAt(Date.now());
    beginRoll(state, new Set());
  }

  function openReasonSheet() {
    setReasonSheetOpen(true);
  }

  function chooseSkipReason(reason: SkipReason) {
    if (!currentCard || !state) return;
    const today = epochDay();
    const roll: RollRecord = {
      id: newId(),
      rolledAt: new Date().toISOString(),
      epochDay: today,
      meal: DINNER.meal,
      restaurantId: currentCard.pick.placeId,
      algoVersion: 'v2-soft',
      candidatesSnapshot: currentCard.snapshot,
      rollIndex: currentRollIndex,
      action: 'skipped',
      skipReason: reason,
    };
    appendRoll(roll);
    const next = structuredClone(state);
    applySkip(next, currentCard.pick, reason);
    saveState(next);
    setState(next);

    setReasonSheetOpen(false);

    const nextSkipCount = skipCount + 1;
    setSkipCount(nextSkipCount);
    const nextExclude = new Set(excludeIds);
    nextExclude.add(currentCard.pick.placeId);

    if (nextSkipCount >= 3) {
      performDowngrade(next, nextExclude);
    } else {
      beginRoll(next, nextExclude);
    }
  }

  function finalizeAccept(
    pick: Restaurant,
    snapshot: CandidateSnapshot[],
    rollIndex: number,
    decisionSeconds: number,
  ) {
    if (!state) return;
    const today = epochDay();
    const roll: RollRecord = {
      id: newId(),
      rolledAt: new Date().toISOString(),
      epochDay: today,
      meal: DINNER.meal,
      restaurantId: pick.placeId,
      algoVersion: 'v2-soft',
      candidatesSnapshot: snapshot,
      rollIndex,
      action: 'accepted',
    };
    appendRoll(roll);
    const next = structuredClone(state);
    markEaten(next, pick, today);
    saveState(next);
    setState(next);

    setJustAccepted({ seconds: decisionSeconds, rolls: rollCount });
    setLockedRoll(roll);
    resetSession();
    setPhase('locked');
  }

  function handleAccept() {
    if (!currentCard) return;
    const elapsed = rollStartAt ? Math.max(1, Math.round((Date.now() - rollStartAt) / 1000)) : 0;
    finalizeAccept(currentCard.pick, currentCard.snapshot, currentRollIndex, elapsed);
  }

  function handleAcceptDowngrade(candidate: CandidateSnapshot, elapsed: number) {
    if (!downgradeSnapshot) return;
    const restaurant = findRestaurant(candidate.placeId);
    if (!restaurant) return;
    finalizeAccept(restaurant, downgradeSnapshot, currentRollIndex, elapsed);
  }

  function handleGiveUp() {
    resetSession();
    setPhase('idle');
  }

  function handleReroll() {
    setLockedRoll(null);
    setJustAccepted(null);
    resetSession();
    setPhase('idle');
  }

  if (phase === 'loading' || !state) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
    );
  }

  if (phase === 'feedback') {
    const roll = feedbackQueue[0];
    const restaurant = findRestaurant(roll.restaurantId);
    const name = restaurant?.name ?? '那家店';
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div
          className="fx-rise flex flex-col gap-4 rounded-[24px] p-5"
          style={{ background: 'var(--color-neutral-900)', color: 'var(--color-neutral-100)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[.12em] uppercase" style={{ opacity: 0.6 }}>
            <span className="inline-block h-3 w-3 rounded-[4px]" style={{ background: 'var(--color-accent)' }} />
            今天吃什么 · 补问
          </div>
          <p className="font-heading text-lg">上次的 {name} 怎么样？</p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleFeedback('good')}
              className="btn"
              style={{ background: 'var(--color-accent)', color: 'var(--color-neutral-900)', height: 46 }}
            >
              👍 好吃
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('ok')}
              className="btn"
              style={{ background: 'rgba(245,234,216,.14)', color: 'var(--color-neutral-100)', height: 46 }}
            >
              😐 一般
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('bad')}
              className="btn"
              style={{ background: 'rgba(245,234,216,.14)', color: 'var(--color-neutral-100)', height: 46 }}
            >
              👎 不好吃
            </button>
            <button
              type="button"
              onClick={handleNoShow}
              className="btn"
              style={{ background: 'rgba(245,234,216,.14)', color: 'var(--color-neutral-100)', height: 46 }}
            >
              没去成
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'locked') {
    const restaurant = lockedRoll ? findRestaurant(lockedRoll.restaurantId) : undefined;
    if (!restaurant) {
      return (
        <div className="flex flex-1 items-center justify-center text-muted">加载中…</div>
      );
    }
    return (
      <div className="flex flex-1 flex-col gap-4 pt-1 pb-3">
        <div
          className="fx-pop relative overflow-hidden rounded-[28px] p-6"
          style={{ background: 'var(--color-accent-600)', color: 'var(--color-bg)', boxShadow: 'var(--shadow-md)' }}
        >
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-[150px] w-[150px] rounded-full"
            style={{ background: 'rgba(245,234,216,.12)' }}
          />
          <div className="relative text-[11px] font-bold tracking-[.16em] uppercase" style={{ opacity: 0.85 }}>
            今天就是它了 · Locked
          </div>
          <div className="relative mt-2 font-heading text-[28px] leading-[1.14]">{restaurant.name}</div>
          <div className="relative mt-2 text-[13px]" style={{ opacity: 0.9 }}>{restaurant.address}</div>
          <div className="relative mt-3">
            <RestaurantFacts r={restaurant} inverted />
          </div>
        </div>

        {justAccepted && (
          <p
            className="fx-pop px-1 text-center text-[12.5px] leading-relaxed"
            style={{ color: 'var(--color-neutral-600)', animationDelay: '70ms' }}
          >
            决策用了 <b>{justAccepted.seconds} 秒</b>，摇了 {justAccepted.rolls} 次。晚 8 点我会来问你好不好吃。
          </p>
        )}

        <a
          href={mapsUrlFor(restaurant.name, restaurant.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="fx-pop btn btn-primary btn-block text-center"
          style={{ height: 52, fontSize: 17, animationDelay: '130ms' }}
        >
          在 Google Maps 打开
        </a>

        <button
          type="button"
          onClick={handleReroll}
          className="fx-pop btn btn-block"
          style={{
            height: 46,
            background: 'transparent',
            border: '1px dashed var(--color-neutral-400)',
            color: 'var(--color-neutral-700)',
            animationDelay: '190ms',
          }}
        >
          重新摇（今晚变卦了）
        </button>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p style={{ color: 'var(--color-text)' }}>今晚没有开门的候选</p>
        <button type="button" onClick={handleGiveUp} className="btn btn-ghost">
          返回
        </button>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-7 pb-6">
        <div className="deck">
          <div
            className="deck-layer"
            style={{
              background: 'var(--color-accent-2-300)',
              border: '1px solid var(--color-accent-2-400)',
              transform: 'rotate(-7deg) translate(-8px, 8px)',
            }}
          />
          <div
            className="deck-layer"
            style={{
              background: 'var(--color-accent-300)',
              border: '1px solid var(--color-accent-400)',
              transform: 'rotate(4deg) translate(6px, 4px)',
            }}
          />
          <button
            type="button"
            onClick={handleStartRoll}
            className="deck-layer"
          >
            {/* 摇晃只作用在装饰面上：按钮命中区域保持静止，指针/自动化才有稳定目标 */}
            <span
              className="fx-wobble deck-layer flex flex-col items-center justify-center gap-4 overflow-hidden"
              style={{ background: 'var(--color-accent-600)', boxShadow: 'var(--shadow-lg)', color: 'var(--color-bg)' }}
            >
            <span
              className="pointer-events-none absolute rounded-full"
              style={{ width: 170, height: 170, border: '1.5px solid rgba(245,234,216,.28)' }}
            />
            <span
              className="pointer-events-none absolute rounded-full"
              style={{ width: 124, height: 124, border: '1.5px solid rgba(245,234,216,.34)' }}
            />
            <span
              className="pointer-events-none absolute rounded-full"
              style={{ width: 82, height: 82, background: 'rgba(245,234,216,.12)' }}
            />
            <span className="relative font-heading text-[36px] leading-none tracking-tight">摇一摇</span>
            <span className="relative text-[11px] font-bold tracking-[.16em] uppercase" style={{ opacity: 0.8 }}>
              Shake the deck
            </span>
            </span>
          </button>
        </div>
        <p className="max-w-[260px] text-center text-[13px] leading-relaxed" style={{ color: 'var(--color-neutral-700)' }}>
          池子里 {SEED_RESTAURANTS.length} 家，按概率抽样，不取最大值 —— 所以每天不一样。
        </p>
      </div>
    );
  }

  if (phase === 'rolling') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-6">
        <div className="relative h-[300px] w-[230px]">
          <div className="fx-flip absolute inset-0">
            <div
              className="absolute inset-0 flex items-center justify-center rounded-[24px] [backface-visibility:hidden]"
              style={{ background: 'var(--color-accent-600)', boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="h-28 w-28 rounded-full" style={{ border: '2px solid rgba(245,234,216,.4)' }} />
            </div>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[24px] p-6 text-center [backface-visibility:hidden] [transform:rotateY(180deg)]"
              style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)', boxShadow: 'var(--shadow-lg)' }}
            >
              {currentCard && (
                <>
                  <div className="font-heading text-[24px] leading-[1.15]">{currentCard.pick.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-neutral-600)' }}>
                    {categoryLabel(currentCard.pick)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs tracking-wide" style={{ color: 'var(--color-neutral-600)' }}>翻牌…</div>
      </div>
    );
  }

  if (phase === 'downgrade') {
    const top3 = downgradeSnapshot
      ? [...downgradeSnapshot].sort((a, b) => b.score - a.score).slice(0, 3)
      : [];
    return (
      <div className="flex flex-1 flex-col gap-4 pt-1 pb-3">
        <div className="fx-pop">
          <div className="font-heading text-[22px] leading-[1.2]">行，你自己挑</div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
            摇三次都不满意，说明今天我不懂你。三个候选，直接选。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {top3.map((c, i) => {
            const restaurant = findRestaurant(c.placeId);
            if (!restaurant) return null;
            const swatch = swatchFor(categoryOf(restaurant));
            return (
              <button
                key={c.placeId}
                type="button"
                onClick={() => {
                  const elapsed = rollStartAt
                    ? Math.max(1, Math.round((Date.now() - rollStartAt) / 1000))
                    : 0;
                  handleAcceptDowngrade(c, elapsed);
                }}
                className="fx-pop flex flex-col items-start gap-2 rounded-[20px] p-4 text-left transition-transform active:scale-[.98]"
                style={{
                  background: 'var(--color-neutral-100)',
                  border: '1px solid var(--color-divider)',
                  boxShadow: 'var(--shadow-sm)',
                  animationDelay: `${i * 90}ms`,
                }}
              >
                <div className="flex w-full items-baseline justify-between gap-3">
                  <span className="font-heading text-[19px]">{restaurant.name}</span>
                  <span className="tag" style={{ background: swatch.bg, color: swatch.ink }}>
                    {categoryLabel(restaurant)}
                  </span>
                </div>
                <RestaurantFacts r={restaurant} />
                <span className="text-xs" style={{ color: 'var(--color-neutral-600)' }}>{restaurant.reason}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleGiveUp}
          className="btn btn-block"
          style={{
            height: 46,
            background: 'transparent',
            border: '1px dashed var(--color-neutral-400)',
            color: 'var(--color-neutral-700)',
          }}
        >
          今天不吃了，算了
        </button>
      </div>
    );
  }

  // phase === 'result'
  if (!currentCard) return null;
  const { pick } = currentCard;
  const swatch = swatchFor(categoryOf(pick));
  return (
    <div className="fx-pop flex flex-1 flex-col gap-4 pb-3">
      <div
        className="rounded-[28px] p-5"
        style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="tag" style={{ background: swatch.bg, color: swatch.ink }}>
            {categoryLabel(pick)}
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--color-neutral-600)' }}>
            第 {currentRollIndex + 1} 摇
          </span>
        </div>
        <div className="font-heading text-[28px] leading-[1.12]">{pick.name}</div>
        <div className="mt-1 mb-3 text-[12.5px]" style={{ color: 'var(--color-neutral-600)' }}>{pick.address}</div>
        <div
          className="flex flex-wrap gap-x-3 gap-y-1 border-b pb-3 text-[12.5px] font-semibold"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <RestaurantFacts r={pick} />
        </div>
        <p className="fx-drop pt-3 text-[13px] leading-relaxed" style={{ color: 'var(--color-neutral-800)' }}>
          {reasonLine(state, pick, epochDay())}
        </p>
      </div>

      <div
        className="fx-drop rounded-[16px] p-4 text-[13px] leading-relaxed"
        style={{ background: 'var(--color-accent-2-200)', color: 'var(--color-accent-2-800)' }}
      >
        {pick.reason}
      </div>

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={handleAccept}
          className="btn btn-primary"
          style={{ flex: 1.4, height: 52, fontSize: 17 }}
        >
          就它了
        </button>
        <button
          type="button"
          onClick={openReasonSheet}
          className="btn btn-secondary"
          style={{ flex: 1, height: 52, fontSize: 16 }}
        >
          换一个
        </button>
      </div>

      {reasonSheetOpen && (
        <ReasonSheet onPick={chooseSkipReason} onClose={() => setReasonSheetOpen(false)} />
      )}
    </div>
  );
}
