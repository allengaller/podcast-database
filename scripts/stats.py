#!/usr/bin/env python3
"""Corpus statistics generator.

Auto-writes (between HTML comment markers, idempotent):
  - podcasts/README.md  : directory tree with per-category counts
  - podcasts/README.md  : 「当前合计」 summary line
  - README.md (root)    : 「当前合计」 summary line
  - podcasts/INDEX.md   : full sortable index table (whole file generated)

Usage:
  python3 scripts/stats.py          # regenerate targets in place
  python3 scripts/stats.py --check  # exit 1 if any target is stale
"""
import os
import sys

sys.path.insert(0, __file__.rsplit("/", 1)[0])
from corpus import ROOT, ensure_under_root, load_corpus, safe_write  # noqa: E402

CATEGORY_LABELS = {
    "zh": {
        "ai": "AI / 大模型",
        "tech": "科技 / 互联网",
        "business": "商业 / 创业",
        "finance": "财经 / 投资",
        "culture": "文化 / 人文",
        "news": "新闻 / 时政",
        "life": "生活 / 自我成长",
        "story": "罪案 / 悬疑 / 历史",
        "comedy": "喜剧 / 脱口秀",
    },
    "en": {
        "ai": "AI / 大模型",
        "tech": "科技 / 风投",
        "business": "商业 / 创业",
        "news": "新闻 / 时政",
        "science": "科学 / 科普",
        "culture": "文化 / 访谈",
        "comedy": "喜剧 / 娱乐",
        "true-crime": "真实犯罪",
        "history": "历史",
        "education": "教育 / 知识",
        "health": "健康 / 健身",
    },
}

TREE_BEGIN = "<!-- corpus:begin:tree -->"
TREE_END = "<!-- corpus:end:tree -->"
SUMMARY_BEGIN = "<!-- corpus:begin:summary -->"
SUMMARY_END = "<!-- corpus:end:summary -->"


def label(lang, category):
    return CATEGORY_LABELS.get(lang, {}).get(category, category)


def collect(entries):
    stats = {}
    for e in entries:
        lang = e.get("language")
        cat = e.get("category")
        bucket = stats.setdefault(lang, {}).setdefault(cat, {"total": 0, "deep": 0})
        bucket["total"] += 1
        if e.is_deep:
            bucket["deep"] += 1
    return stats


def render_tree(stats):
    lines = ["podcasts/", "├── README.md          ← 结构 / 字段 / 原则(本文件)",
             "├── _template.md       ← 标准档模板", "├── INDEX.md           ← 总索引(自动生成)"]
    langs = [l for l in ("zh", "en") if l in stats]
    for li, lang in enumerate(langs):
        prefix = "└── " if li == len(langs) - 1 else "├── "
        name = "zh/                ← 中文播客" if lang == "zh" else "en/                ← 英文 / 国际播客"
        lines.append(f"{prefix}{name}")
        cats = sorted(stats[lang])
        for ci, cat in enumerate(cats):
            b = stats[lang][cat]
            cat_prefix = "    └── " if (li == len(langs) - 1 and ci == len(cats) - 1) \
                else ("    ├── " if li == len(langs) - 1 else "│   ├── ")
            lines.append(f"{cat_prefix}{cat + '/':<14} {label(lang, cat):<14}"
                         f"({b['total']} 档 · 深档 {b['deep']})")
    return "\n".join(lines)


def render_summary(entries):
    total = len(entries)
    zh = sum(1 for e in entries if e.get("language") == "zh")
    en = sum(1 for e in entries if e.get("language") == "en")
    deep = sum(1 for e in entries if e.is_deep)
    as_of = max(str(e.get("updated_date", "1970-01-01")) for e in entries)
    return (f"**当前合计**:**{total} 档**(中文 {zh} + 英文 {en}),"
            f"其中深档 {deep} 档、stub {total - deep} 档(截至 {as_of};"
            f"由 `scripts/stats.py` 自动统计,勿手改)")


def render_index(entries):
    lines = ["# INDEX · 语料总索引", "",
             "> 由 `scripts/stats.py` 自动生成,请勿手改。"
             "状态为 `active` / `ended` / `hiatus` 的是深档,`todo` 为待收录 stub。", ""]
    for lang in ("zh", "en"):
        subset = sorted((e for e in entries if e.get("language") == lang),
                        key=lambda e: (str(e.get("category")), str(e.get("title"))))
        if not subset:
            continue
        title = "中文播客(zh)" if lang == "zh" else "英文 / 国际播客(en)"
        lines += [f"## {title} · {len(subset)} 档", "",
                  "| 节目 | 赛道 | 状态 | 主播(首位) | 最近更新 | 条目 |",
                  "| --- | --- | --- | --- | --- | --- |"]
        for e in subset:
            hosts = e.hosts
            first_host = str(hosts[0]) if hosts else "—"
            status_mark = e.status if e.is_deep else "todo(stub)"
            lines.append(f"| {e.get('title')} | {e.get('category')} | {status_mark} "
                         f"| {first_host} | {e.get('updated_date')} "
                         f"| [`{e.stem}`]({os.path.relpath(e.path, os.path.join(ROOT, 'podcasts'))}) |")
        lines.append("")
    return "\n".join(lines).rstrip() + "\n"


def replace_between(text, begin, end, replacement):
    if begin not in text or end not in text:
        raise SystemExit(f"markers missing: {begin[:30]}… / {end[:30]}…")
    head, rest = text.split(begin, 1)
    _, tail = rest.split(end, 1)
    return f"{head}{begin}\n{replacement}\n{end}{tail}"


def build_targets(entries):
    stats = collect(entries)
    summary = render_summary(entries)
    tree = render_tree(stats)
    index = render_index(entries)

    root_readme = os.path.join(ROOT, "README.md")
    podcasts_readme = os.path.join(ROOT, "podcasts", "README.md")
    index_path = os.path.join(ROOT, "podcasts", "INDEX.md")

    targets = {}
    with open(root_readme, encoding="utf-8") as fh:
        targets[root_readme] = replace_between(fh.read(), SUMMARY_BEGIN, SUMMARY_END, summary)
    with open(podcasts_readme, encoding="utf-8") as fh:
        content = replace_between(fh.read(), SUMMARY_BEGIN, SUMMARY_END, summary)
        targets[podcasts_readme] = replace_between(content, TREE_BEGIN, TREE_END, tree)
    targets[index_path] = index
    return targets


def main():
    check_only = "--check" in sys.argv
    entries, parse_errors = load_corpus()
    if parse_errors:
        print("\n".join(parse_errors))
        return 1
    targets = build_targets(entries)
    stale = []
    for path, content in targets.items():
        ensure_under_root(path)
        if check_only:
            with open(path, encoding="utf-8") as fh:
                if fh.read() != content:
                    stale.append(os.path.relpath(path, ROOT))
        else:
            safe_write(path, content)
            print(f"wrote {os.path.relpath(path, ROOT)}")
    if check_only:
        if stale:
            print("STALE (run scripts/stats.py to refresh): " + ", ".join(stale))
            return 1
        print("stats fresh")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
