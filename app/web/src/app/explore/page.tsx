'use client';

import { useState } from 'react';

import Link from 'next/link';

import CandidateList from '@/components/explore/CandidateList';
import EntryForm from '@/components/explore/EntryForm';
import type { EntryTab } from '@/components/explore/EntryForm';
import { analyzeNote, previewPlace, searchPlaces } from '@/components/explore/exploreClient';
import { rememberLocalImport } from '@/components/explore/localExploreCache';
import NoteExtractionPanel from '@/components/explore/NoteExtractionPanel';
import PreviewCard from '@/components/explore/PreviewCard';
import { CandidateListSkeleton, PreviewCardSkeleton } from '@/components/explore/Skeletons';
import type { DishMention, ImportPreview, PlaceCandidate } from '@/lib/places/contract';

type View = 'entry' | 'noteResult' | 'candidates' | 'preview' | 'success';

export default function ExplorePage() {
  const [view, setView] = useState<View>('entry');
  const [entryTab, setEntryTab] = useState<EntryTab>('search');

  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');

  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);

  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [noteQueries, setNoteQueries] = useState<string[]>([]);
  const [noteDishes, setNoteDishes] = useState<DishMention[]>([]);
  const [pendingDishes, setPendingDishes] = useState<DishMention[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  function backToEntry() {
    setError(null);
    setView('entry');
  }

  async function runSearch(q: string, dishesForPreview: DishMention[]) {
    setError(null);
    setPending(true);
    setPendingDishes(dishesForPreview);
    try {
      const res = await searchPlaces(q);
      setDemo((prev) => prev || res.demo);
      setCandidates(res.candidates);
      setView('candidates');
    } catch (e) {
      setError(e instanceof Error ? e.message : '出错了，稍后再试');
    } finally {
      setPending(false);
    }
  }

  async function handleSearchSubmit() {
    const q = query.trim();
    if (!q) return;
    await runSearch(q, []);
  }

  async function handleNoteSubmit() {
    const text = note.trim();
    if (!text) return;
    setError(null);
    setPending(true);
    try {
      const res = await analyzeNote(text);
      setDemo((prev) => prev || res.demo);
      setNoteQueries(res.queries);
      setNoteDishes(res.dishes);
      setView('noteResult');
    } catch (e) {
      setError(e instanceof Error ? e.message : '出错了，稍后再试');
    } finally {
      setPending(false);
    }
  }

  async function handlePickCandidate(candidate: PlaceCandidate) {
    setError(null);
    setPending(true);
    setView('preview');
    try {
      const res = await previewPlace(candidate.placeId, pendingDishes.length > 0 ? pendingDishes : undefined);
      setDemo((prev) => prev || res.demo);
      setPreview(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : '出错了，稍后再试');
      setView('candidates');
    } finally {
      setPending(false);
    }
  }

  function handleConfirm() {
    if (!preview) return;
    setConfirming(true);
    rememberLocalImport(preview.restaurant.placeId);
    setConfirming(false);
    setView('success');
  }

  function resetAll() {
    setQuery('');
    setNote('');
    setCandidates([]);
    setNoteQueries([]);
    setNoteDishes([]);
    setPendingDishes([]);
    setPreview(null);
    setError(null);
    setEntryTab('search');
    setView('entry');
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-3">
      {demo && (
        <div
          className="fx-rise rounded-[14px] px-3.5 py-2.5 text-center text-[12px] font-semibold leading-relaxed"
          style={{ background: 'var(--color-accent-200)', color: 'var(--color-accent-800)' }}
        >
          演示数据 —— 还没配置 API key，这些不是真实结果
        </div>
      )}

      {error && (
        <div
          className="fx-pop rounded-[14px] px-3.5 py-2.5 text-[12.5px] leading-relaxed"
          style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-800)', border: '1px solid var(--color-accent-400)' }}
        >
          {error}
        </div>
      )}

      {view === 'entry' && (
        <EntryForm
          tab={entryTab}
          onTabChange={(t) => {
            setEntryTab(t);
            setError(null);
          }}
          query={query}
          onQueryChange={setQuery}
          onSearchSubmit={handleSearchSubmit}
          note={note}
          onNoteChange={setNote}
          onNoteSubmit={handleNoteSubmit}
          pending={pending}
        />
      )}

      {view === 'noteResult' && (
        <NoteExtractionPanel
          queries={noteQueries}
          dishes={noteDishes}
          onPickQuery={(q) => {
            setQuery(q);
            void runSearch(q, noteDishes);
          }}
          onBack={backToEntry}
        />
      )}

      {view === 'candidates' && (
        pending
          ? <CandidateListSkeleton />
          : (
            <CandidateList
              candidates={candidates}
              onPick={handlePickCandidate}
              onBack={() => setView(pendingDishes.length > 0 ? 'noteResult' : 'entry')}
            />
          )
      )}

      {view === 'preview' && (
        pending || !preview
          ? <PreviewCardSkeleton />
          : (
            <>
              <PreviewCard preview={preview} onConfirm={handleConfirm} confirming={confirming} />
              <button
                type="button"
                onClick={() => setView('candidates')}
                className="btn btn-ghost"
                style={{ alignSelf: 'center' }}
              >
                换一家看看
              </button>
            </>
          )
      )}

      {view === 'success' && preview && (
        <div className="fx-pop flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <div className="text-[40px]">🎉</div>
          <div className="font-heading text-[20px]">加入池子成功</div>
          <p className="max-w-[260px] text-[13px] leading-relaxed" style={{ color: 'var(--color-neutral-600)' }}>
            {preview.restaurant.name} 现在是你的一员了。
          </p>
          <div className="mt-2 flex w-full gap-2.5">
            <button type="button" onClick={resetAll} className="btn btn-secondary" style={{ flex: 1, height: 48 }}>
              再找一家
            </button>
            <Link href="/" className="btn btn-primary text-center" style={{ flex: 1, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              去摇一摇
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
