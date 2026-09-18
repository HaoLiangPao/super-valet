# Super Valet — 仓库与文档流程
 
产品：「今天晚上吃什么」— 单用户餐厅决策 App，GTA / Downtown Markham 锚点。
仓库：`github.com/HaoLiangPao/super-valet`（private, monorepo）
 
## 目录结构
 
```
docs/
├── README.md        自动生成的索引，不要手改
├── OPEN-QUESTIONS.md 未拍板的问题，定了就写 ADR 并删掉
├── design/          0001 产品企划书 · 0002 菜系分类与距离规格
├── decisions/       0001 用 ADR · 0002 Bandit 建模 · 0003 技术栈(proposed)
├── research/        0001 Fable 设计评审
└── assets/
data/                seed-restaurants-markham.ts（15 家种子数据）
app/                 产品代码（未建）
scripts/             gen_docs_index.py / check_frontmatter.py
.github/             design-doc issue 模板、PR 模板、docs CI
```
 
## 文档流程
 
1. 开 `design-doc` issue 提出问题
2. 从 `TEMPLATE.md` 复制到 `docs/design/NNNN-slug.md`，`status: draft`
3. 开 PR 评审，定稿改 `status: accepted`
4. 代码 PR 在描述里链回该 doc
5. 设计被推翻不删除，改 `status: superseded` + 填 `superseded_by`
**文档只增不删。** status 词表：`draft → review → accepted → implemented`；旁支 `proposed`（ADR 未拍板）、`superseded`、`rejected`。
 
## 自动化
 
- `python3 scripts/gen_docs_index.py` 重新生成 `docs/README.md`
- `python3 scripts/gen_docs_index.py --check` CI 检查索引是否过期
- `python3 scripts/check_frontmatter.py` 校验 id 唯一、status 合法、日期格式
## 已记录的决策
 
| ADR | 内容 | 状态 |
| --- | --- | --- |
| 0001 | 用 ADR 记录架构决策 | accepted |
| 0002 | 把推荐问题建模为 Multi-Armed Bandit | accepted |
| 0003 | Next.js 15 + Supabase + Drizzle + Vercel | **proposed** — PostGIS / Web Push / Drizzle 范围三项被 Fable 反对，未裁决 |
 
## 未决问题（详见 docs/OPEN-QUESTIONS.md）
 
🔴 挡住 schema 冻结：Q1 两层 Bandit 要不要现在进 schema · Q2 地理锚点三选一 · Q3 PostGIS 上不上
🟡 影响顺序：Q4 Web Push vs Telegram bot · Q5 Bradley-Terry 冷启动值不值 · Q6「摇一摇」是门槛还是仪式
 
## Fable 评审的核心结论
 
1. 最大风险是**数据体制**：每天 1 样本、反馈回收 30–50%，六个月只有 60–90 个有效观测。V1→V3 路线建立在不存在的样本量上。
2. 单店级 Thompson Sampling **不会收敛**（区分 0.70 vs 0.85 需每店 ~60 反馈）。它的作用是「有原则的随机化」而非学习。
3. 两层 Bandit：**schema 现在就加类别层**，但打分用软乘积而非硬两阶段。
4. 算法版本差异**统计上不可检测**（月度采纳率 CI ±20pp）→ 数据看板、熵监控大幅后移。
5. 多样性坍缩的真实形态是**几何坍缩**（工作日午餐硬过滤后只剩 4–5 家）→ 唯一解法是池子扩到 30–40 家。
6. 反对 PostGIS；Web Push on iOS 是最大技术风险，建议 Telegram bot 做反馈通道。
7. 种子文件有 bug：`isOpenAt` 对 `day: null` 的跨零点窗口在凌晨返回 false。
8. 下周该写的第一个文件是 `sim.py`（180 天模拟）—— 能关掉一半开放问题。
## 已知限制：Cowork session 推不了这个仓库
 
session 的 git 代理只给「授权仓库集合」注入凭证，`HaoLiangPao/super-valet` 不在里面，push 返回 403。需要在 Cowork 的 session sources 里把这个仓库加进来，Claude 才能直接 push / 开 PR。在那之前用 zip 交付 + 本地 push。
 