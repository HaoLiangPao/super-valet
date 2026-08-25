#!/usr/bin/env python3
"""Validate the frontmatter of every design doc / ADR.

Catches the drift that makes a docs index useless: missing status,
duplicate ids, a `superseded` doc with no pointer to its replacement.

    python3 scripts/check_frontmatter.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gen_docs_index import DOCS, SECTIONS, parse_frontmatter  # noqa: E402

REQUIRED = ["id", "title", "status", "author", "created", "updated"]
VALID_STATUS = {
    "draft", "proposed", "review", "accepted",
    "implemented", "superseded", "deprecated", "rejected",
}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def main() -> int:
    problems: list[str] = []
    seen: dict[str, str] = {}

    for folder, _, _ in SECTIONS:
        directory = DOCS / folder
        if not directory.is_dir():
            continue
        for path in sorted(directory.glob("*.md")):
            if path.name in ("README.md", "TEMPLATE.md"):
                continue
            rel = path.relative_to(DOCS.parent).as_posix()
            meta = parse_frontmatter(path)

            if not meta:
                problems.append(f"{rel}: 缺少 `---` frontmatter")
                continue

            for key in REQUIRED:
                if not meta.get(key):
                    problems.append(f"{rel}: frontmatter 缺少 `{key}`")

            status = meta.get("status", "").lower()
            if status and status not in VALID_STATUS:
                problems.append(
                    f"{rel}: status `{status}` 不合法（可用：{', '.join(sorted(VALID_STATUS))}）"
                )
            if status in ("superseded", "deprecated") and not meta.get("superseded_by"):
                problems.append(f"{rel}: status 是 {status}，但没填 `superseded_by`")

            for key in ("created", "updated"):
                value = meta.get(key)
                if value and not DATE_RE.match(value):
                    problems.append(f"{rel}: `{key}` 应为 YYYY-MM-DD，实际是 `{value}`")

            doc_id = meta.get("id")
            if doc_id:
                key = f"{folder}/{doc_id}"
                if key in seen:
                    problems.append(f"{rel}: id `{doc_id}` 与 {seen[key]} 重复")
                else:
                    seen[key] = rel

    if problems:
        print("frontmatter 有问题：\n")
        for p in problems:
            print(f"  ✗ {p}")
        print(f"\n共 {len(problems)} 个问题。")
        return 1

    print(f"frontmatter OK（检查了 {len(seen)} 篇文档）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
