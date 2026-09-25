'use client';

import type { PlaceCandidate } from '@/lib/places/contract';

export default function CandidateList({
  candidates,
  onPick,
  onBack,
}: {
  candidates: PlaceCandidate[];
  onPick: (candidate: PlaceCandidate) => void;
  onBack: () => void;
}) {
  if (candidates.length === 0) {
    return (
      <div className="fx-pop flex flex-col items-center gap-3 py-8 text-center">
        <p style={{ color: 'var(--color-neutral-600)' }}>没找到，换个说法再试试</p>
        <button type="button" onClick={onBack} className="btn btn-secondary">
          重新搜索
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {candidates.map((c, i) => (
        <button
          key={c.placeId}
          type="button"
          onClick={() => onPick(c)}
          className="fx-pop flex flex-col items-start gap-1.5 rounded-[18px] p-3.5 text-left transition-transform active:scale-[.98]"
          style={{
            background: 'var(--color-neutral-100)',
            border: '1px solid var(--color-divider)',
            animationDelay: `${Math.min(i, 8) * 40}ms`,
          }}
        >
          <span className="font-heading text-[16px] leading-[1.2]">{c.name}</span>
          <span className="text-[12px]" style={{ color: 'var(--color-neutral-600)' }}>
            {c.address}
          </span>
          {(c.rating != null || c.ratingCount != null) && (
            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--color-neutral-700)' }}>
              {c.rating != null ? `★ ${c.rating.toFixed(1)}` : ''}
              {c.ratingCount != null ? `（${c.ratingCount}）` : ''}
            </span>
          )}
        </button>
      ))}
      <button
        type="button"
        onClick={onBack}
        className="btn btn-block mt-1"
        style={{
          height: 44,
          background: 'transparent',
          border: '1px dashed var(--color-neutral-400)',
          color: 'var(--color-neutral-700)',
        }}
      >
        换个词重新搜
      </button>
    </div>
  );
}
