#!/usr/bin/env python3
"""Generate stub podcast entries (status: todo) for the corpus.

Each stub is a minimal Markdown file with frontmatter (title/slug/language/
category/status=todo) and a "待收录" body. We NEVER invent hosts/networks/
episodes — that's the whole point of a stub.

Usage:
  python3 scripts/make-stub.py <language> <category> "Title One" "Title Two" ...
The slug is derived from the title; pass --slug=explicit-slug before a title
to override. Files are written under podcasts/<lang>/<category>/<slug>.md
and skipped if they already exist.
"""
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "podcasts")


def slugify(title: str) -> str:
    # For English titles: lowercase, non-alnum -> hyphen, collapse, trim.
    s = re.sub(r"[^A-Za-z0-9]+", "-", title).strip("-").lower()
    return s or "untitled"


def main() -> int:
    argv = sys.argv[1:]
    if len(argv) < 3:
        print(__doc__)
        return 2
    lang, category = argv[0], argv[1]
    entries = argv[2:]

    out_dir = os.path.join(ROOT, lang, category)
    os.makedirs(out_dir, exist_ok=True)

    n_made = n_skipped = 0
    override_slug = None
    for e in entries:
        if e.startswith("--slug="):
            override_slug = e.split("=", 1)[1]
            continue
        title = e
        slug = override_slug or slugify(title)
        override_slug = None
        path = os.path.join(out_dir, f"{slug}.md")
        if os.path.exists(path):
            print(f"skip (exists): {path}")
            n_skipped += 1
            continue
        body = f"""---
title: "{title}"
slug: {slug}
language: {lang}
category: {category}
status: todo
added_date: 2026-08-03
updated_date: 2026-08-03
tags:
  - 待收录
---

# {title}

> **待收录(stub)。** 本条目仅占位,主播 / 出品方 / 形式 / 代表单集等细节
> 尚未核实,欢迎补充。详见 [`_template.md`](../_template.md) 与
> [README「Stub 条目」](../README.md#编写原则重要)。

## 待补充

- 主播与背景
- 出品方 / 播客网络
- 内容定位与形式(赛道、时长、更新频率)
- 受众画像
- 代表单集
- 平台与订阅链接
- 影响力与评测

## 资料来源 / 待核

- 全部字段:TODO。
"""
        with open(path, "w") as fh:
            fh.write(body)
        print(f"made: {path}")
        n_made += 1

    print(f"\nmade {n_made}, skipped {n_skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
