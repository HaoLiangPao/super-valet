#!/usr/bin/env python3
"""sim.py — Supper Valet 180 天决策流模拟。

目的（见 docs/research/0001 §7）：用 15 家真实种子店（营业时间、距离、
slot_lock 全部来自 data/seed-restaurants-markham.ts）+ 合成用户偏好，
在 180 天内对比推荐策略，量化：

  Q1/Q5 —— 单店 Thompson Sampling vs 两层软乘积 vs V0 加权随机，
           在真实样本预算下到底差多少；菜系可迁移性（σ_store）的敏感度。
  Q4    —— 反馈回收率 30% / 60% / 90% 对各策略的影响（Telegram vs 网页补问的代价）。
  Q7    —— 样本预算集中（只做晚餐）vs 分散（午+晚共用一个无上下文模型）。

纯标准库。运行：python3 sim/sim.py   （结果打印 + 写 sim/results.json）
"""

from __future__ import annotations

import json
import math
import random
import statistics
from collections import defaultdict
from pathlib import Path

from seed_data import RESTAURANTS, is_open_at

# ── 菜系类别映射（design/0002 §7 的 category 层）─────────────────────────

CATEGORY_OF = {
    "CN_SICHUAN": "CN_SPICY", "CN_HOTPOT": "CN_SPICY", "CN_SKEWER": "CN_SPICY",
    "CN_HUNAN": "CN_SPICY",
    "CN_DIMSUM": "CN_CANTONESE", "CN_BBQ_MEAT": "CN_CANTONESE",
    "CN_HK_CAFE": "CN_CANTONESE", "CN_CANTON": "CN_CANTONESE", "CN_CONGEE": "CN_CANTONESE",
    "CN_NORTHEAST": "CN_NORTHERN", "CN_NOODLE": "CN_NORTHERN",
    "CN_DUMPLING": "CN_NORTHERN", "CN_XIBEI": "CN_NORTHERN",
    "CN_JIANGZHE": "CN_SOUTHERN", "CN_YUNNAN": "CN_SOUTHERN", "CN_TAIWAN": "CN_SOUTHERN",
    "AS_SUSHI": "AS_JAPANESE", "AS_IZAKAYA": "AS_JAPANESE", "AS_RAMEN": "AS_JAPANESE",
    "AS_KOREAN": "AS_KOREAN", "AS_KBBQ": "AS_KOREAN",
    "WS_BRUNCH": "WS_WESTERN", "WS_CAFE": "WS_WESTERN",
}

DINNER_MIN = 18 * 60 + 30   # 18:30
LUNCH_MIN = 12 * 60 + 30    # 12:30

STORE_PRIOR = (2.0, 1.0)    # design/0001 的乐观先验
CAT_PRIOR = (1.0, 1.0)
GAMMA = 0.5                 # 两层软乘积里类别层的指数（research/0001 §2）


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def cat_of(r):
    return CATEGORY_OF.get(r["primary"], r["primary"].split("_")[0])


# ── 合成用户（每个 seed 一个「真实口味」）────────────────────────────────

def make_truth(rng: random.Random, sigma_store: float):
    cats = sorted({cat_of(r) for r in RESTAURANTS})
    cat_mu = {c: rng.uniform(0.35, 0.85) for c in cats}
    p_dinner, p_lunch = {}, {}
    for r in RESTAURANTS:
        base = clamp(rng.gauss(cat_mu[cat_of(r)], sigma_store), 0.05, 0.95)
        p_dinner[r["place_id"]] = base
        # 午餐口味：单人友好加分、非单人减分 —— 午/晚是两个分布（Q7 的前提）
        shift = 0.12 if r["solo_friendly"] else -0.12
        p_lunch[r["place_id"]] = clamp(base + shift + rng.gauss(0, 0.05), 0.05, 0.95)
    return p_dinner, p_lunch


# ── 环境：某一餐的候选池与接受模型 ──────────────────────────────────────

def eligible(meal: str, weekday: int) -> list[dict]:
    minute = DINNER_MIN if meal == "dinner" else LUNCH_MIN
    out = []
    for r in RESTAURANTS:
        if not r["is_main_meal"] or not r["dine_in"]:
            continue
        if r["slot_lock"] and meal not in r["slot_lock"]:
            continue
        if meal == "lunch" and weekday not in (0, 6) and not r["solo_friendly"]:
            continue  # 工作日午餐 = 单人场景
        if not is_open_at(r, weekday, minute):
            continue
        out.append(r)
    return out


def d0_for(meal: str, weekday: int) -> float:
    weekend = weekday in (0, 6)
    if meal == "lunch":
        return 12.0 if weekend else 2.0
    return 15.0 if weekend else 6.0


def accept_prob(r, truth_p, state, day, meal, weekday):
    """用户面对推荐时的接受概率（环境的 ground truth，策略不可见）。"""
    pid = r["place_id"]
    last = state["last_eaten"].get(pid)
    fresh = 1.0 if last is None else 1 - math.exp(-(day - last) / 10.0)
    dist = math.exp(-r["distance_km"] / d0_for(meal, weekday))
    cat_last = state["cat_last"].get(cat_of(r))
    cat_pen = 0.5 if (cat_last is not None and day - cat_last <= 2) else 1.0
    p = truth_p[pid] * (0.35 + 0.65 * fresh) * (0.55 + 0.45 * dist) * cat_pen
    return clamp(p, 0.0, 1.0), fresh, dist, cat_pen


# ── 策略 ────────────────────────────────────────────────────────────────

def model_factors(r, state, day, meal, weekday):
    pid = r["place_id"]
    last = state["last_eaten"].get(pid)
    fresh = 1.0 if last is None else 1 - math.exp(-(day - last) / 14.0)
    cat_last = state["cat_last"].get(cat_of(r))
    cat_pen = 0.4 if (cat_last is not None and day - cat_last <= 3) else 1.0
    dist = math.exp(-r["distance_km"] / d0_for(meal, weekday))
    return fresh * cat_pen * dist


def pick(policy, pool, state, truth_p, day, meal, weekday, rng):
    if policy == "oracle":
        return max(pool, key=lambda r: accept_prob(r, truth_p, state, day, meal, weekday)[0])
    if policy == "uniform":
        return rng.choice(pool)
    if policy == "v0":
        scores = [model_factors(r, state, day, meal, weekday) for r in pool]
        total = sum(scores) or 1.0
        x, acc = rng.random() * total, 0.0
        for r, s in zip(pool, scores):
            acc += s
            if x <= acc:
                return r
        return pool[-1]
    # v1 / v2：Thompson 采样 × 模型侧因子，取 argmax
    best, best_s = None, -1.0
    for r in pool:
        a, b = state["store"][r["place_id"]]
        theta = rng.betavariate(a, b)
        if policy == "v2":
            ca, cb = state["cat"][cat_of(r)]
            theta *= rng.betavariate(ca, cb) ** GAMMA
        s = theta * model_factors(r, state, day, meal, weekday)
        if s > best_s:
            best, best_s = r, s
    return best


def update(policy, state, r, kind):
    """kind: good / ok / bad / skip_taste。只有 v1/v2 有后验；v2 同步更新类别层。"""
    if policy not in ("v1", "v2"):
        return
    inc = {"good": (1.0, 0.0), "ok": (0.3, 0.3), "bad": (0.0, 1.0), "skip_taste": (0.0, 0.3)}[kind]
    a, b = state["store"][r["place_id"]]
    state["store"][r["place_id"]] = (a + inc[0], b + inc[1])
    if policy == "v2":
        ca, cb = state["cat"][cat_of(r)]
        state["cat"][cat_of(r)] = (ca + inc[0], cb + inc[1])


# ── 单次 180 天模拟 ─────────────────────────────────────────────────────

def run_once(policy, scope, recovery, sigma_store, seed):
    rng = random.Random(seed)
    p_dinner, p_lunch = make_truth(rng, sigma_store)
    state = {
        "store": defaultdict(lambda: STORE_PRIOR),
        "cat": defaultdict(lambda: CAT_PRIOR),
        "last_eaten": {},
        "cat_last": {},
    }
    log = []  # 只记晚餐：(day, pid, true_p, first_roll_accept)
    meals = ["dinner"] if scope == "dinner" else ["lunch", "dinner"]

    for day in range(180):
        weekday = day % 7
        for meal in meals:
            truth = p_dinner if meal == "dinner" else p_lunch
            pool = eligible(meal, weekday)
            if not pool:
                continue
            offered, eaten = set(), None
            for roll in range(3):
                cands = [r for r in pool if r["place_id"] not in offered]
                if not cands:
                    break
                r = pick(policy, cands, state, truth, day, meal, weekday, rng)
                offered.add(r["place_id"])
                ap, fresh, dist, cat_pen = accept_prob(r, truth, state, day, meal, weekday)
                if rng.random() < ap:
                    eaten = r
                    if meal == "dinner":
                        log.append((day, r["place_id"], truth[r["place_id"]], roll == 0))
                    break
                # skip 原因分流（design/0001 §2：只有口味性 skip 惩罚单店）
                if dist < 0.35 and dist <= min(fresh, cat_pen):
                    pass  # too_far：纯上下文，不更新
                elif fresh < 0.45:
                    pass  # just_ate：不更新（design/0002 §5.3）
                elif cat_pen < 1.0:
                    pass  # wrong_cuisine：类别冷却问题，V1 粒度下不惩罚单店
                else:
                    update(policy, state, r, "skip_taste")  # skip 当场收集，不依赖推送
            if eaten is not None:
                pid = eaten["place_id"]
                state["last_eaten"][pid] = day
                state["cat_last"][cat_of(eaten)] = day
                enjoyed = rng.random() < truth[pid]
                if rng.random() < recovery:  # 只有吃后评分受回收率影响
                    kind = "good" if enjoyed else ("ok" if rng.random() < 0.6 else "bad")
                    update(policy, state, eaten, kind)

    # ── 指标 ──
    n = len(log)
    days_eaten = n
    quality = statistics.mean(t for _, _, t, _ in log) if n else 0.0
    q_last60 = statistics.mean(t for d, _, t, _ in log if d >= 120) or 0.0 if any(
        d >= 120 for d, _, _, _ in log) else 0.0
    first = statistics.mean(1.0 if f else 0.0 for _, _, _, f in log) if n else 0.0
    cat_counts = defaultdict(int)
    for _, pid, _, _ in log:
        cat_counts[cat_of(next(r for r in RESTAURANTS if r["place_id"] == pid))] += 1
    entropy = -sum((c / n) * math.log2(c / n) for c in cat_counts.values()) if n else 0.0
    distinct = len({pid for _, pid, _, _ in log})
    # 后验能不能认出真爱店（仅 v1/v2）
    top1 = None
    if policy in ("v1", "v2"):
        post = {pid: a / (a + b) for pid, (a, b) in state["store"].items()}
        # 只在「晚餐场景可能出现过」的店里比，纯外带/只做午市的店不算
        reachable = {r["place_id"] for wd in range(7) for r in eligible("dinner", wd)}
        if post and reachable:
            best_post = max(post, key=post.get)
            best_true = max(reachable, key=lambda pid: p_dinner[pid])
            top1 = 1.0 if best_post == best_true else 0.0
    # 月度采纳率（首摇接受），用于可检测性
    monthly = []
    for m in range(6):
        acc = [1.0 if f else 0.0 for d, _, _, f in log if m * 30 <= d < (m + 1) * 30]
        monthly.append(statistics.mean(acc) if acc else 0.0)
    return {
        "days_eaten": days_eaten, "quality": quality, "q_last60": q_last60,
        "first_accept": first, "entropy": entropy, "distinct": distinct,
        "top1": top1, "monthly": monthly,
    }


# ── 汇总 ────────────────────────────────────────────────────────────────

def aggregate(runs):
    out = {}
    for k in ("days_eaten", "quality", "q_last60", "first_accept", "entropy", "distinct"):
        vals = [r[k] for r in runs]
        out[k] = (statistics.mean(vals), statistics.stdev(vals) if len(vals) > 1 else 0.0)
    t1 = [r["top1"] for r in runs if r["top1"] is not None]
    out["top1"] = statistics.mean(t1) if t1 else None
    m1 = [r["monthly"][0] for r in runs]
    m6 = [r["monthly"][5] for r in runs]
    out["month1"] = (statistics.mean(m1), statistics.stdev(m1))
    out["month6"] = (statistics.mean(m6), statistics.stdev(m6))
    return out


def main():
    N = 150
    policies = ["uniform", "v0", "v1", "v2", "oracle"]
    results = {}

    print("═══ 主网格：晚餐 only，回收率 × 菜系可迁移性 ═══")
    for sigma in (0.10, 0.25):
        for rec in (0.3, 0.6, 0.9):
            for pol in policies:
                runs = [run_once(pol, "dinner", rec, sigma, 1000 + i) for i in range(N)]
                agg = aggregate(runs)
                results[f"dinner|rec={rec}|sigma={sigma}|{pol}"] = agg
                q, qs = agg["quality"]
                f, fs = agg["first_accept"]
                e, _ = agg["entropy"]
                t1 = f"top1={agg['top1']:.2f}" if agg["top1"] is not None else ""
                print(f"σ={sigma} rec={rec} {pol:8s} 质量={q:.3f}±{qs:.3f} "
                      f"首摇采纳={f:.3f}±{fs:.3f} 熵={e:.2f}bits {t1}")

    print("\n═══ Q7：样本集中 vs 分散（rec=0.6, σ=0.10，只看晚餐指标）═══")
    for scope in ("dinner", "both"):
        for pol in ("v0", "v1", "v2"):
            runs = [run_once(pol, scope, 0.6, 0.10, 2000 + i) for i in range(N)]
            agg = aggregate(runs)
            results[f"scope={scope}|{pol}"] = agg
            q, qs = agg["quality"]
            ql, _ = agg["q_last60"]
            print(f"scope={scope:6s} {pol:3s} 晚餐质量={q:.3f}±{qs:.3f} 后60天={ql:.3f}")

    print("\n═══ 可检测性：v1 首月 vs 第六月首摇采纳（跨 seed 波动）═══")
    a = results["dinner|rec=0.6|sigma=0.1|v1"] if "dinner|rec=0.6|sigma=0.1|v1" in results \
        else results["dinner|rec=0.6|sigma=0.10|v1"]
    print(f"month1={a['month1'][0]:.3f}±{a['month1'][1]:.3f}  "
          f"month6={a['month6'][0]:.3f}±{a['month6'][1]:.3f}")

    Path(__file__).with_name("results.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=1))
    print("\nwrote sim/results.json")


if __name__ == "__main__":
    main()
