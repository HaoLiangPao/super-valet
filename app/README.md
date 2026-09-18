# app/

产品代码。选型依据 [ADR-0003](../docs/decisions/0003-tech-stack.md)（proposed，
争议项见文内表格）；范围与引擎结构依据 [design/0003](../docs/design/0003-p0-web-app.md)。

## web/ — P0 Web App

Next.js 16 (App Router) + TypeScript + Tailwind v4。**本地优先**：数据存
localStorage（shape 对齐 design/0001 §6 的表结构），无外部服务依赖。

```bash
cd app/web
npm install       # 首次
npm run dev       # http://localhost:3000
npm test          # 引擎单元测试（vitest）
npm run build     # 生产构建 + ESLint
```

结构：

```
src/lib/engine/   推荐引擎：两层软乘积 Bandit（ADR-0005），对餐次无感知（ADR-0004）
src/data/         种子数据（源自 ../../data/，含修复版营业时间；改动要同步两处）
src/app/          页面：/ 牌堆摇一摇 · /pool 池子 · /history 记录
```

注意：ADR-0003 写的是 Next.js 15，`create-next-app@latest` 实际交付 16.x，
按「不逆工具链」原则采纳，已记录在 research/0003 收尾报告。
