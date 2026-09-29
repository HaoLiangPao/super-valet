import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * 跨层接线的回归测试（第二例）。
 *
 * S4 把刷新引擎、节制条款、报告落库全部写好并测绿了，但
 * `maybeAutoRefresh()` **零调用点** —— 功能存在于代码里，却永远不会发生。
 * 「每月自动刷新」是 Hao 点名要的第一件事，验收时差点又只验了相邻的那一步。
 *
 * 这和 `pool-roll-wiring.test.ts` 钉的是同一类断裂（INSTRUCTION.md §3）：
 * 数据层全绿 ≠ 功能存在。所以从两头钉：调用点必须在，且必须挂进 layout。
 */

const src = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8');

describe('自动刷新的接线（回归：S4 交付时零调用点）', () => {
  it('★ maybeAutoRefresh 必须有调用点', () => {
    const comp = src('src/components/AutoRefresh.tsx');
    expect(comp).toMatch(/maybeAutoRefresh\(\)/);
  });

  it('★ AutoRefresh 必须挂进 layout，且在身份门禁之内', () => {
    const layout = src('src/app/layout.tsx');
    expect(layout).toMatch(/<AutoRefresh\s*\/>/);
    // 门禁之内：AutoRefresh 出现在 <AuthGate> 与 </AuthGate> 之间
    const inGate = layout.slice(
      layout.indexOf('<AuthGate>'),
      layout.indexOf('</AuthGate>'),
    );
    expect(inGate).toMatch(/<AutoRefresh\s*\/>/);
  });

  it('接线组件不渲染任何东西（后台任务不该占界面）', () => {
    expect(src('src/components/AutoRefresh.tsx')).toMatch(/return null;/);
  });

  it('后台失败不许冒泡（catch 兜住）', () => {
    expect(src('src/components/AutoRefresh.tsx')).toMatch(/\.catch\(/);
  });
});
