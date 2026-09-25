import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * 单测跑在 node 环境（不需要 DOM；需要 localStorage 的用例自己装 shim）。
 * 这里唯一的重点是把 `@/` 别名补上 —— 源码里用的是 tsconfig paths，
 * 而 vitest 不读 tsconfig，缺了它任何 import 到 `@/…` 的模块都会解析失败。
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
  },
});
