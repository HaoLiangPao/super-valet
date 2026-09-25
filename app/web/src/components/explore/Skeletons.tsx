'use client';

/** 候选列表加载中的骨架——服务端 Places/LLM 调用有冷启动，先给点反馈 */
export function CandidateListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-[18px] p-3.5"
          style={{ background: 'var(--color-neutral-100)', border: '1px solid var(--color-divider)' }}
        >
          <div className="h-4 w-2/3 rounded-full" style={{ background: 'var(--color-neutral-300)' }} />
          <div className="mt-2 h-3 w-4/5 rounded-full" style={{ background: 'var(--color-neutral-300)' }} />
        </div>
      ))}
    </div>
  );
}

/** 预览卡加载中的骨架 */
export function PreviewCardSkeleton() {
  return (
    <div
      className="animate-pulse card elev-md"
      aria-hidden="true"
      style={{ border: '1px solid var(--color-divider)' }}
    >
      <div className="h-5 w-1/3 rounded-full" style={{ background: 'var(--color-neutral-300)' }} />
      <div className="h-6 w-3/4 rounded-full" style={{ background: 'var(--color-neutral-300)' }} />
      <div className="h-3 w-1/2 rounded-full" style={{ background: 'var(--color-neutral-300)' }} />
      <div className="h-16 w-full rounded-[16px]" style={{ background: 'var(--color-neutral-200)' }} />
      <div className="h-11 w-full rounded-full" style={{ background: 'var(--color-neutral-300)' }} />
    </div>
  );
}
