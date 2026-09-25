import type {
  ClassifyInput,
  Classification,
  DishMention,
  NoteAnalyzer,
  NoteExtraction,
} from '@/lib/places/contract';
import { FIXTURE_PLACES } from '@/lib/places/fixture';
import { ruleClassify, sanitizeClassification, UNKNOWN_FALLBACK } from './codes';

/**
 * 离线 / 确定性的 NoteAnalyzer（ADR-0007 §3）。
 *
 * 一条硬规则：**fixture 不编造事实，只做确定性的文本匹配。**
 * 它抽出来的每一个查询串都必须能在输入文本里指出出处，
 * 否则「演示数据」就变成了「假数据」，而这正是 design/0005 §4.2 要防的东西。
 */

/** 命中就当作一条菜品提及；只覆盖目录里那几家店的招牌，够演示与单测用 */
const DISH_LEXICON: readonly string[] = [
  '毛肚', '虾滑', '番茄锅', '鸭肠', '捞面',
  '刺身', '三文鱼', '玉子烧', '天妇罗', '定食',
  '梅菜扣肉', '红烧肉', '狮子头',
];

function sentenceAround(text: string, needle: string): string | undefined {
  const idx = text.indexOf(needle);
  if (idx < 0) return undefined;
  const start = Math.max(0, text.lastIndexOf('\n', idx) + 1);
  const breaks = ['。', '！', '？', '\n', '.', '!', '?'];
  let end = text.length;
  for (const b of breaks) {
    const at = text.indexOf(b, idx);
    if (at >= 0 && at + 1 < end) end = at + 1;
  }
  const quote = text.slice(start, end).trim();
  return quote ? quote.slice(0, 120) : undefined;
}

export class FixtureNoteAnalyzer implements NoteAnalyzer {
  async extractCandidates(text: string): Promise<NoteExtraction> {
    const lower = text.toLowerCase();

    const queries: string[] = [];
    for (const place of FIXTURE_PLACES) {
      const hit = place.keywords.find((k) => lower.includes(k.toLowerCase()));
      if (hit && !queries.includes(hit)) queries.push(hit);
    }

    // 目录一个都没命中：退回「第一行非空文本」当查询串。
    // 这仍然是从输入里取的（笔记标题几乎都是店名），不是凭空生成的店名。
    if (queries.length === 0) {
      const firstLine = text.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
      if (firstLine) queries.push(firstLine.slice(0, 30));
    }

    const dishes: DishMention[] = [];
    for (const name of DISH_LEXICON) {
      if (!text.includes(name)) continue;
      const quote = sentenceAround(text, name);
      dishes.push({ name, ...(quote ? { quote } : {}), sentiment: 'positive' });
    }

    return { queries, dishes };
  }

  async classify(input: ClassifyInput): Promise<Classification> {
    const known = FIXTURE_PLACES.find((p) => p.name === input.name);
    if (known) return known.classification;

    const ruleCode = ruleClassify(input.primaryType);
    if (ruleCode) {
      return sanitizeClassification(
        { confidence: 0.9, reason: 'Google 类型直接命中' },
        { ruleCode },
      );
    }
    return { ...UNKNOWN_FALLBACK, reason: '演示数据：信息不足' };
  }
}
