'use client';

import { useEffect, useState } from 'react';

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
  | 'result'
  | 'skip'
  | 'downgrade'
  | 'empty';

const SKIP_OPTIONS: { reason: SkipReason; label: string }[] = [
  { reason: 'too_far', label: '太远了' },
  { reason: 'too_pricey', label: '太贵了' },
  { reason: 'just_ate', label: '刚吃过' },
  { reason: 'wrong_cuisine', label: '不想吃这个菜系' },
  { reason: 'closed', label: '关门了' },
  { reason: 'no_mood', label: '就是不想吃' },
  { reason: 'other', label: '不说，直接换' },
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

function RestaurantFacts({ r }: { r: Restaurant }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-brown">
      <span>
        ★ {r.rating.toFixed(1)}（{r.ratingCount}）
      </span>
      {r.priceLevel != null && <span>{'$'.repeat(r.priceLevel)}</span>}
      <span>{r.distanceKm} km</span>
    </div>
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
  }

  function performRoll(currentState: EngineState, exclude: Set<string>) {
    const idx = rollCount;
    const today = epochDay();
    const weekday = new Date().getDay();
    const result = rollOnce(SEED_RESTAURANTS, currentState, DINNER, today, weekday, exclude);
    setRollCount(idx + 1);
    setCurrentRollIndex(idx);
    setExcludeIds(exclude);
    if (!result) {
      setCurrentCard(null);
      setPhase('empty');
      return;
    }
    setCurrentCard(result);
    setPhase('result');
  }

  function performDowngrade(currentState: EngineState, exclude: Set<string>) {
    const idx = rollCount;
    const today = epochDay();
    const weekday = new Date().getDay();
    const result = rollOnce(SEED_RESTAURANTS, currentState, DINNER, today, weekday, exclude);
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
    performRoll(state, new Set());
  }

  function openSkipChips() {
    setPhase('skip');
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

    const nextSkipCount = skipCount + 1;
    setSkipCount(nextSkipCount);
    const nextExclude = new Set(excludeIds);
    nextExclude.add(currentCard.pick.placeId);

    if (nextSkipCount >= 3) {
      performDowngrade(next, nextExclude);
    } else {
      performRoll(next, nextExclude);
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
      <div className="flex flex-1 items-center justify-center text-brown/60">加载中…</div>
    );
  }

  if (phase === 'feedback') {
    const roll = feedbackQueue[0];
    const restaurant = findRestaurant(roll.restaurantId);
    const name = restaurant?.name ?? '那家店';
    return (
      <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
        <p className="font-serif text-lg text-brown-dark">上次的 {name} 怎么样？</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleFeedback('good')}
            className="rounded-2xl bg-brown-dark/10 py-3 text-brown-dark transition-colors active:bg-brown-dark/20"
          >
            👍 好吃
          </button>
          <button
            type="button"
            onClick={() => handleFeedback('ok')}
            className="rounded-2xl bg-brown-dark/10 py-3 text-brown-dark transition-colors active:bg-brown-dark/20"
          >
            😐 一般
          </button>
          <button
            type="button"
            onClick={() => handleFeedback('bad')}
            className="rounded-2xl bg-brown-dark/10 py-3 text-brown-dark transition-colors active:bg-brown-dark/20"
          >
            👎 不好吃
          </button>
          <button
            type="button"
            onClick={handleNoShow}
            className="rounded-2xl bg-brown-dark/10 py-3 text-brown-dark transition-colors active:bg-brown-dark/20"
          >
            没去成
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'locked') {
    const restaurant = lockedRoll ? findRestaurant(lockedRoll.restaurantId) : undefined;
    if (!restaurant) {
      return (
        <div className="flex flex-1 items-center justify-center text-brown/60">加载中…</div>
      );
    }
    return (
      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <h1 className="font-serif text-3xl text-brown-dark">今晚就是它 · {restaurant.name}</h1>
        <p className="text-sm text-brown-dark/80">{restaurant.address}</p>
        {justAccepted && (
          <p className="text-xs text-brown/60">
            决策用了 {justAccepted.seconds} 秒，摇了 {justAccepted.rolls} 次
          </p>
        )}
        <a
          href={mapsUrlFor(restaurant.name, restaurant.address)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 w-full rounded-3xl bg-brown-dark py-4 text-center font-medium text-cream shadow-lg transition-transform active:scale-95"
        >
          在 Google Maps 打开
        </a>
        <p className="text-xs text-brown/60">晚点会问你好不好吃</p>
        <button
          type="button"
          onClick={handleReroll}
          className="mt-6 text-sm text-brown/70 underline underline-offset-2"
        >
          重新摇（今晚变卦了）
        </button>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <p className="text-brown-dark">今晚没有开门的候选</p>
        <button
          type="button"
          onClick={handleGiveUp}
          className="text-sm text-brown/70 underline underline-offset-2"
        >
          返回
        </button>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="flex flex-1 flex-col justify-center gap-8">
        <div className="relative mx-auto h-56 w-64">
          <div className="absolute inset-0 rotate-[-8deg] rounded-3xl bg-brown/15" />
          <div className="absolute inset-0 rotate-[6deg] rounded-3xl bg-gold/25" />
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-brown-dark/10 bg-white shadow-md">
            <span className="text-6xl">🎲</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleStartRoll}
          className="w-full rounded-3xl bg-brown-dark py-4 font-serif text-lg text-cream shadow-lg transition-transform active:scale-95"
        >
          🎲 摇一摇
        </button>
      </div>
    );
  }

  if (phase === 'skip') {
    if (!currentCard) return null;
    return (
      <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
        <p className="font-serif text-lg text-brown-dark">
          为什么不想吃 {currentCard.pick.name}？
        </p>
        <div className="flex flex-wrap gap-2">
          {SKIP_OPTIONS.map((opt) => (
            <button
              key={opt.reason}
              type="button"
              onClick={() => chooseSkipReason(opt.reason)}
              className="rounded-full border border-brown/30 px-4 py-2 text-sm text-brown-dark transition-colors active:bg-brown/10"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'downgrade') {
    const top3 = downgradeSnapshot
      ? [...downgradeSnapshot].sort((a, b) => b.score - a.score).slice(0, 3)
      : [];
    return (
      <div className="mt-6 flex flex-col gap-4">
        <p className="text-center font-serif text-lg text-brown-dark">挑一家吧</p>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {top3.map((c) => {
            const restaurant = findRestaurant(c.placeId);
            if (!restaurant) return null;
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
                className="flex w-[75%] shrink-0 flex-col gap-2 rounded-3xl bg-white p-5 text-left shadow-md transition-transform active:scale-95"
              >
                <span className="font-serif text-xl text-brown-dark">{restaurant.name}</span>
                <RestaurantFacts r={restaurant} />
                <span className="w-fit rounded-full bg-gold/20 px-3 py-1 text-xs text-brown-dark">
                  {categoryLabel(restaurant)}
                </span>
                <span className="text-xs text-brown/70">{restaurant.reason}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleGiveUp}
          className="text-center text-sm text-brown/70 underline underline-offset-2"
        >
          今天不吃了，算了
        </button>
      </div>
    );
  }

  // phase === 'result'
  if (!currentCard) return null;
  const { pick } = currentCard;
  return (
    <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-md">
      <h2 className="font-serif text-2xl text-brown-dark">{pick.name}</h2>
      <RestaurantFacts r={pick} />
      <span className="w-fit rounded-full bg-gold/20 px-3 py-1 text-xs text-brown-dark">
        {categoryLabel(pick)}
      </span>
      <p className="text-sm text-brown-dark/80">{reasonLine(state, pick, epochDay())}</p>
      <p className="text-xs text-brown/70">{pick.reason}</p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          className="flex-1 rounded-2xl bg-brown-dark py-3 font-medium text-cream transition-transform active:scale-95"
        >
          就它了
        </button>
        <button
          type="button"
          onClick={openSkipChips}
          className="flex-1 rounded-2xl border border-brown-dark/30 py-3 font-medium text-brown-dark transition-colors active:bg-brown-dark/10"
        >
          换一个
        </button>
      </div>
    </div>
  );
}
