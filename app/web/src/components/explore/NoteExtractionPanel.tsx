'use client';

import type { DishMention } from '@/lib/places/contract';

const SENTIMENT_GLYPH: Record<NonNullable<DishMention['sentiment']>, string> = {
  positive: '👍',
  neutral: '﹣',
  negative: '👎',
};

export default function NoteExtractionPanel({
  queries,
  dishes,
  onPickQuery,
  onBack,
}: {
  queries: string[];
  dishes: DishMention[];
  onPickQuery: (query: string) => void;
  onBack: () => void;
}) {
  if (queries.length === 0) {
    return (
      <div className="fx-pop flex flex-col items-center gap-3 py-8 text-center">
        <p style={{ color: 'var(--color-neutral-600)' }}>
          没抽出可定位的店名，笔记里写具体点，或者直接用「找店名」搜
        </p>
        <button type="button" onClick={onBack} className="btn btn-secondary">
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="fx-pop flex flex-col gap-4">
      <div>
        <div className="mb-2 text-[12.5px] font-semibold" style={{ color: 'var(--color-neutral-700)' }}>
          从笔记里认出这些店，点一个去搜
        </div>
        <div className="flex flex-wrap gap-2">
          {queries.map((q) => (
            <button key={q} type="button" onClick={() => onPickQuery(q)} className="chip">
              {q}
            </button>
          ))}
        </div>
      </div>

      {dishes.length > 0 && (
        <div>
          <div className="mb-2 text-[12.5px] font-semibold" style={{ color: 'var(--color-neutral-700)' }}>
            顺带抽到的菜品提及
          </div>
          <div className="flex flex-col gap-1.5">
            {dishes.map((d, i) => (
              <div
                key={`${d.name}-${i}`}
                className="flex items-start gap-2 rounded-[14px] p-2.5 text-[12.5px]"
                style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)' }}
              >
                <span className="flex-none">{d.sentiment ? SENTIMENT_GLYPH[d.sentiment] : '﹣'}</span>
                <span className="flex-1">
                  <b>{d.name}</b>
                  {d.quote && (
                    <span style={{ color: 'var(--color-neutral-600)' }}>「{d.quote}」</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="btn btn-block"
        style={{
          height: 44,
          background: 'transparent',
          border: '1px dashed var(--color-neutral-400)',
          color: 'var(--color-neutral-700)',
        }}
      >
        换一篇笔记
      </button>
    </div>
  );
}
