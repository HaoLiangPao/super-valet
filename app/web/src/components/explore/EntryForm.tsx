'use client';

import { MAX_NOTE_CHARS } from '@/lib/places/contract';

export type EntryTab = 'search' | 'note';

export default function EntryForm({
  tab,
  onTabChange,
  query,
  onQueryChange,
  onSearchSubmit,
  note,
  onNoteChange,
  onNoteSubmit,
  pending,
}: {
  tab: EntryTab;
  onTabChange: (tab: EntryTab) => void;
  query: string;
  onQueryChange: (v: string) => void;
  onSearchSubmit: () => void;
  note: string;
  onNoteChange: (v: string) => void;
  onNoteSubmit: () => void;
  pending: boolean;
}) {
  const overLimit = note.length > MAX_NOTE_CHARS;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex gap-1 rounded-full p-1"
        style={{ background: 'var(--color-neutral-200)' }}
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'search'}
          onClick={() => onTabChange('search')}
          className="btn flex-1"
          style={
            tab === 'search'
              ? { background: 'var(--color-accent)', color: 'var(--color-bg)' }
              : { color: 'var(--color-neutral-700)' }
          }
        >
          找店名
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'note'}
          onClick={() => onTabChange('note')}
          className="btn flex-1"
          style={
            tab === 'note'
              ? { background: 'var(--color-accent)', color: 'var(--color-bg)' }
              : { color: 'var(--color-neutral-700)' }
          }
        >
          粘贴笔记
        </button>
      </div>

      {tab === 'search' ? (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
        >
          <div className="field">
            <label htmlFor="explore-query">店名或关键词</label>
            <input
              id="explore-query"
              className="input"
              placeholder="海底捞 Markham"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={pending || query.trim().length === 0}
            className="btn btn-primary btn-block"
            style={{ height: 48 }}
          >
            {pending ? '搜索中…' : '搜索'}
          </button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onNoteSubmit();
          }}
        >
          <div className="field">
            <label htmlFor="explore-note">粘贴笔记正文</label>
            <textarea
              id="explore-note"
              className="input"
              style={{ minHeight: 150, borderRadius: 20, resize: 'vertical', lineHeight: 1.5 }}
              placeholder="粘贴小红书 / 大众点评的正文，越具体越好…"
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span style={{ color: 'var(--color-neutral-600)' }}>
              我们不抓取任何平台，只处理你主动粘贴的文字
            </span>
            <span
              className="flex-none font-semibold"
              style={{ color: overLimit ? 'var(--color-accent-700)' : 'var(--color-neutral-500)' }}
            >
              {note.length}/{MAX_NOTE_CHARS}
            </span>
          </div>
          {overLimit && (
            <p className="text-[11.5px] font-semibold" style={{ color: 'var(--color-accent-700)' }}>
              超过 {MAX_NOTE_CHARS} 字了，剪短一点再试
            </p>
          )}
          <button
            type="submit"
            disabled={pending || note.trim().length === 0 || overLimit}
            className="btn btn-primary btn-block"
            style={{ height: 48 }}
          >
            {pending ? '抽取中…' : '抽取店名'}
          </button>
        </form>
      )}
    </div>
  );
}
