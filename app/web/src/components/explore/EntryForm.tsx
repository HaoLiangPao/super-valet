'use client';

import { useT } from '@/lib/i18n';
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
  const t = useT();
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
          {t('explore.tab.search')}
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
          {t('explore.tab.note')}
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
            <label htmlFor="explore-query">{t('explore.search.label')}</label>
            <input
              id="explore-query"
              className="input"
              placeholder={t('explore.search.placeholder')}
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
            {pending ? t('explore.search.pending') : t('explore.search.submit')}
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
            <label htmlFor="explore-note">{t('explore.note.label')}</label>
            <textarea
              id="explore-note"
              className="input"
              style={{ minHeight: 150, borderRadius: 20, resize: 'vertical', lineHeight: 1.5 }}
              placeholder={t('explore.note.placeholder')}
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span style={{ color: 'var(--color-neutral-600)' }}>
              {t('explore.note.hint')}
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
              {t('explore.note.overLimit', { max: MAX_NOTE_CHARS })}
            </p>
          )}
          <button
            type="submit"
            disabled={pending || note.trim().length === 0 || overLimit}
            className="btn btn-primary btn-block"
            style={{ height: 48 }}
          >
            {pending ? t('explore.note.pending') : t('explore.note.submit')}
          </button>
        </form>
      )}
    </div>
  );
}
