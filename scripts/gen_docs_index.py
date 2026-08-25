#!/usr/bin/env python3
"""Generate docs/README.md — the index of every design doc and ADR.

Reads the YAML-ish frontmatter at the top of each Markdown file under
docs/design/, docs/decisions/ and docs/research/ and renders a table.

    python3 scripts/gen_docs_index.py           # write docs/README.md
    python3 scripts/gen_docs_index.py --check   # exit 1 if it is out of date

Deliberately dependency-free: a tiny frontmatter parser beats making
everyone install PyYAML to read a doc index.
"""

from __future__ import annotations

import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
INDEX = DOCS / "README.md"

SECTIONS = [
    ("design", "Design Docs", "一个功能一篇：问题、方案、取舍。"),
    ("decisions", "Architecture Decisions (ADR)", "为什么这么选，以及代价是什么。"),
    ("research", "Research & Notes", "调研、竞品、访谈、数据探索。"),
]

STATUS_BADGE = {
    "draft": "📝 draft",
    "proposed": "📝 proposed",
    "review": "👀 review",
    "accepted": "✅ accepted",
    "implemented": "🚢 implemented",
    "superseded": "🗄 superseded",
    "deprecated": "🗄 deprecated",
    "rejected": "🚫 rejected",
}


def parse_frontmatter(path: Path) -> dict[str, str]:
    """Return the top-level key/value pairs from a `---` fenced header."""
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    meta: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if not line.strip() or line.startswith("#") or line.startswith((" ", "\t", "-")):
            continue
        key, sep, value = line.partition(":")
        if not sep:
            continue
        meta[key.strip()] = value.strip().strip("\"'")
    return meta


def collect(folder: str) -> list[dict[str, str]]:
    directory = DOCS / folder
    if not directory.is_dir():
        return []
    rows = []
    for path in sorted(directory.glob("*.md")):
        if path.name == "README.md":
            continue
        meta = parse_frontmatter(path)
        if path.stem == "TEMPLATE" or meta.get("id") in (None, "0000"):
            continue  # templates and unfilled copies stay out of the index
        meta["_path"] = path.relative_to(DOCS).as_posix()
        rows.append(meta)
    rows.sort(key=lambda m: m.get("id", ""))
    return rows


def render() -> str:
    out: list[str] = [
        "<!-- GENERATED FILE — edit the docs, then run scripts/gen_docs_index.py -->",
        "",
        "# 设计文档索引 / Design Docs Index",
        "",
        "所有 Supper Valet 的设计文档都登记在这里。"
        "新增文档后运行 `python3 scripts/gen_docs_index.py` 重新生成本文件。",
        "",
    ]

    total = 0
    for folder, heading, blurb in SECTIONS:
        rows = collect(folder)
        total += len(rows)
        out += [f"## {heading}", "", blurb, ""]
        if not rows:
            out += ["_还没有文档。从 `TEMPLATE.md` 复制一份开始。_", ""]
            continue
        out += [
            "| # | 标题 | 状态 | 作者 | 更新 |",
            "| --- | --- | --- | --- | --- |",
        ]
        for m in rows:
            status = m.get("status", "").lower()
            badge = STATUS_BADGE.get(status, status or "—")
            if status in ("superseded", "deprecated") and m.get("superseded_by"):
                badge += f" → {m['superseded_by']}"
            out.append(
                "| {id} | [{title}]({path}) | {badge} | {author} | {updated} |".format(
                    id=m.get("id", "—"),
                    title=m.get("title", m["_path"]),
                    path=m["_path"],
                    badge=badge,
                    author=m.get("author", "—"),
                    updated=m.get("updated", m.get("created", "—")),
                )
            )
        out.append("")

    out += [
        "---",
        "",
        f"共 {total} 篇文档 · 索引生成于 {date.today().isoformat()} · "
        "由 `scripts/gen_docs_index.py` 维护",
        "",
    ]
    return "\n".join(out)


def main() -> int:
    content = render()
    if "--check" in sys.argv:
        current = INDEX.read_text(encoding="utf-8") if INDEX.exists() else ""
        # ignore the trailing generation date so a rerun on another day is not a diff
        strip = lambda s: "\n".join(l for l in s.splitlines() if "索引生成于" not in l)
        if strip(current) != strip(content):
            print("docs/README.md is out of date — run: python3 scripts/gen_docs_index.py")
            return 1
        print("docs/README.md is up to date.")
        return 0
    INDEX.write_text(content, encoding="utf-8")
    print(f"wrote {INDEX.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
