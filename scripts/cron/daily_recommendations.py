#!/usr/bin/env python3
"""每日推荐 cron 入口(本仓版,替代原外部 Mavis cron)。

工作流:
1. 取 UTC 当日日期作为 YYYY-MM-DD(可在 CLI 覆盖)
3. 若 `recommendations/YYYY-MM-DD.md` 已存在,直接退出(幂等)
4. 否则写入 frontmatter + 占位骨架,留给后续研究回填(PR / model agent)

用法:
  python3 scripts/cron/daily_recommendations.py           # 用 UTC 当天日期
  python3 scripts/cron/daily_recommendations.py 2026-09-10  # 覆盖日期(调试用)

退出码:
  0  已存在(无动作)或已成功写入新骨架
  1  参数错误或写入失败
"""
import datetime
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
REC_DIR = os.path.join(ROOT, "recommendations")


def today_utc_str():
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")


def target_path(date_str):
    return os.path.join(REC_DIR, f"{date_str}.md")


def render_template(date_str):
    return f"""---
title: "{date_str} 全网热门播客每日推荐(索引)"
date: {date_str}
type: daily-picks-index
author: GitHub Actions cron (.github/workflows/cron-daily.yml)
language_cover: ["zh", "en"]
categories: [ai, tech, business, science, culture, news, comedy, history]
source_corpus: podcast-database
verification: TODO(由研究 agent 回填 web_search 来源)
new_stubs_today: 0
total_picks: 0
related_cron_task: "全面获取最新全网各类热门播客"
---

# {date_str} 每日推荐 · 索引

> 本文件**仅为索引**。每档推荐理由、精彩节目、订阅地址详见对应语料库原档。
>
> **不重复造档原则**:详见 [`README.md`](./README.md)「融合安置」工作流。

## 今日 N 档

### 中文(0 档)

| # | 节目 | 主播 | 赛道 | 原档 |
|---|------|------|------|------|

### 英文(0 档)

| # | 节目 | 主播 | 赛道 | 原档 |
|---|------|------|------|------|

## 趋势摘要

> TODO(由研究 agent 回填 1-3 条核心趋势)。

## 趋势来源

> TODO(由研究 agent 回填 web_search 验证到的 2026 年关键事实,3-5 条)。

## 当日动作

- ✅ 无需新建
- ⚠️ 待回写
- 📅 下一份索引日期:{(parse_date(date_str) + datetime.timedelta(days=1)).strftime("%Y-%m-%d")}
"""


def parse_date(s):
    return datetime.datetime.strptime(s, "%Y-%m-%d")


def main():
    if len(sys.argv) >= 2:
        date_str = sys.argv[1]
    else:
        date_str = today_utc_str()

    try:
        parse_date(date_str)
    except ValueError:
        print(f"bad date format: {date_str} (want YYYY-MM-DD)", file=sys.stderr)
        return 1

    path = target_path(date_str)
    if os.path.exists(path):
        print(f"exists, no-op: {os.path.relpath(path, ROOT)}")
        return 0

    if not os.path.isdir(REC_DIR):
        print(f"missing dir: {REC_DIR}", file=sys.stderr)
        return 1

    os.makedirs(REC_DIR, exist_ok=True)
    content = render_template(date_str)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"created: {os.path.relpath(path, ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())