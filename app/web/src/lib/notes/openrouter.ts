import type {
  ClassifyInput,
  Classification,
  NoteAnalyzer,
  NoteExtraction,
} from '@/lib/places/contract';
import { MAX_NOTE_CHARS } from '@/lib/places/contract';
import { ProviderError } from '@/lib/places/errors';
import {
  SUBCUISINE_CODES,
  ruleClassify,
  sanitizeClassification,
  sanitizeDishes,
} from './codes';

/**
 * 用 DeepSeek（经 OpenRouter）做「把散文变成搜索词」与
 * 「把 Places 的事实映射到我们的分类表」。
 *
 * ⚠️ design/0005 §4.2 的硬边界在这里：
 * **这个文件里的模型永远看不到、也永远不产出坐标 / 营业时间 / 评分 / 价位 / placeId。**
 * 它只拿到店名、Google 类型、简介和评论摘录，只返回分类与菜名。
 * 事实字段全部来自 `PlaceProvider`。加字段的时候先回来读这一段。
 *
 * 为什么不装 SDK：OpenRouter 是 OpenAI 兼容的 HTTP 接口，一个 fetch 就够，
 * 省一个依赖也省一次供应链面。
 */

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
/** Hao 指定 DeepSeek；留一个环境变量以便换模型而不改代码 */
const DEFAULT_MODEL = 'deepseek/deepseek-chat';
const EXTRACT_MAX_TOKENS = 2048;
const CLASSIFY_MAX_TOKENS = 512;
const TIMEOUT_MS = 30_000;

const EXTRACT_SYSTEM = `你是餐厅笔记解析器。用户会粘贴一段美食笔记（小红书 / 大众点评 / 自己的备忘录 / 任何文本）。

你的任务只有两件：
1. 抽出文中提到的**餐厅**，每家给一个可以直接丢给地图搜索的查询串（店名 + 城市/商场线索，如「海底捞 Markham」）。
2. 抽出文中提到的**具体菜名**，以及它出现的那句原文。

铁律：
- 只抽文本里**真实出现**的餐厅和菜名。**绝对不要补全、不要推测、不要凭常识添加**没写的店或菜。
- 不要输出地址、坐标、营业时间、评分、价格 —— 这些一律由地图服务提供，不归你管。
- 文中一家餐厅都没有就返回空数组，这是完全可以接受的答案。
- queries 最多 5 条，dishes 最多 20 条。

只返回 JSON：
{"queries":["店名 城市"],"dishes":[{"name":"菜名","quote":"原文那句","sentiment":"positive|neutral|negative"}]}`;

function classifySystem(): string {
  return `你是餐厅菜系分类器。根据给出的信息判断这家餐厅的子菜系与用餐场景。

可选 code（primary 与 tags 都**必须**从中选择，不许自创）：
${SUBCUISINE_CODES.join(' ')}

可选 slotLock 值：breakfast lunch dinner latenight

只返回 JSON：
{"primary":"CODE","tags":["CODE"],"soloFriendly":true,"slotLock":["dinner"],"isMainMeal":true,"priorBias":1.0,"confidence":0.0,"reason":"20字以内"}

字段含义：
- primary: 唯一主菜系 code；tags: 含 primary 在内最多 3 个 code
- soloFriendly: 一个人去吃会不会尴尬（火锅大桌、烤肉 → false；面馆、寿司吧 → true）
- slotLock: 只在这些餐段营业/合适；全天通吃就给空数组
- isMainMeal: 能当正餐吃（奶茶店、甜品店、咖啡馆 → false）
- priorBias: 0.6–1.0，默认 1.0；明显是美式中餐 / 连锁快餐这类「能吃但不惊喜」的给 0.7

判断要点：
- 中文店名里的地名字号是最强信号（渝蜀川 → 川菜，潮粤港 → 粤港，东北铁锅 → 东北菜）
- 出现 General Tso / Chop Suey / Egg Roll / Combo Plate → CN_AMERICANIZED
- **无法确定时 confidence 给低分，不要硬猜** —— 用户会看到并手动改，猜错比说不知道更贵`;
}

/** 从模型回复里抠出 JSON；模型偶尔会套一层 ```json 代码块或加一句废话 */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * 上游错误一律在这里收口：真实原因只进服务端日志，
 * 返给浏览器的永远是一句中文（errors.ts 的纪律）。
 */
function wrap(cause: unknown, what: string, status = 502): ProviderError {
  console.error(`[explore] ${what} 调用失败`, cause);
  if (status === 429) {
    return new ProviderError('AI 分析排队中，稍等一下再试', { status: 429, cause });
  }
  return new ProviderError('AI 分析暂时用不了，稍后再试', { status: 502, cause });
}

export interface OpenRouterAnalyzerOptions {
  apiKey: string;
  model?: string;
  /** 注入用，单测不打网 */
  fetchImpl?: typeof fetch;
}

export class OpenRouterNoteAnalyzer implements NoteAnalyzer {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: OpenRouterAnalyzerOptions) {
    this.apiKey = options.apiKey;
    this.model = options.model ?? DEFAULT_MODEL;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async chat(system: string, user: string, maxTokens: number, what: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    let res: Response;
    try {
      res = await this.fetchImpl(ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          // OpenRouter 用这两个头做用量归属，非必填但有助于排查
          'HTTP-Referer': 'https://supper-valet.vercel.app',
          'X-Title': 'Supper Valet',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
      });
    } catch (cause) {
      throw wrap(cause, what);
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      // 上游 body 可能回显 key 片段，只读状态码，绝不把 body 带进异常消息
      throw wrap(new Error(`HTTP ${res.status}`), what, res.status === 429 ? 429 : 502);
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return json.choices?.[0]?.message?.content ?? '';
  }

  async extractCandidates(text: string): Promise<NoteExtraction> {
    const raw = await this.chat(
      EXTRACT_SYSTEM,
      text.slice(0, MAX_NOTE_CHARS),
      EXTRACT_MAX_TOKENS,
      '笔记抽取',
    );
    const parsed = extractJson(raw);
    const obj = (typeof parsed === 'object' && parsed !== null ? parsed : {}) as Record<string, unknown>;

    const queries = (Array.isArray(obj.queries) ? obj.queries : [])
      .filter((q): q is string => typeof q === 'string')
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .filter((q, i, arr) => arr.indexOf(q) === i)
      .slice(0, 5);

    return { queries, dishes: sanitizeDishes(obj.dishes) };
  }

  async classify(input: ClassifyInput): Promise<Classification> {
    // design/0002 §8.2 Step 1：规则表能定的就不花钱问模型要 primary。
    // 仍然问一次的原因是场景字段（soloFriendly / slotLock / isMainMeal）规则表给不了，
    // 而 `sanitizeClassification` 会让规则表的 code 压过模型的 primary。
    const ruleCode = ruleClassify(input.primaryType);

    const lines = [
      `店名：${input.name}`,
      `Google 类型：${input.primaryType ?? '（未知）'}`,
      `Google 简介：${input.editorialSummary ?? '（无）'}`,
      `用户评论摘录：\n${(input.reviewSnippets ?? []).map((r) => `- ${r}`).join('\n') || '（无）'}`,
    ];
    if (ruleCode) lines.push(`已知规则映射给出的 primary：${ruleCode}（除非评论明显矛盾，照此判断）`);

    const raw = await this.chat(classifySystem(), lines.join('\n'), CLASSIFY_MAX_TOKENS, '菜系分类');
    return sanitizeClassification(extractJson(raw), { ruleCode });
  }
}
