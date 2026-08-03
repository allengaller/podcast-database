# Podcast Database · 全网热点播客深度研究语料库

> 一个以 **Markdown 为主** 的播客赛道研究语料库:逐档记录全网(中文 + 英文)头部播客的定位、主播、形式、受众、代表单集与影响力。
>
> 用途:内容研究、对标分析、选题参考、播客生态观察。

---

## 这是什么

本仓库是一个**播客本身这个赛道的深度研究语料库**。核心理念:一档播客 = 一个 Markdown 文件,标准化字段 + 结构化正文,可读、可检索、可持续维护。

语言分仓:中文播客放 [`podcasts/zh/`](./podcasts/zh/),英文 / 国际播客放 [`podcasts/en/`](./podcasts/en/),按赛道分子目录(科技 / 商业 / 财经 / 文化 / 新闻 / 科学 / 喜剧 / 生活)。

## 快速导航

| 你想… | 去哪 |
| --- | --- |
| 了解语料库结构、字段规范、编写原则 | [`podcasts/README.md`](./podcasts/README.md) |
| 新增一档播客,照模板填 | [`podcasts/_template.md`](./podcasts/_template.md) |
| 浏览中文播客 | [`podcasts/zh/`](./podcasts/zh/) |
| 浏览英文播客 | [`podcasts/en/`](./podcasts/en/) |
| 查阅历史 LeetCast 代码 | [`tools/`](./tools/) · 见 [`tools/ARCHIVE.md`](./tools/ARCHIVE.md) |

## 当前进度

- **批次 1(2026-08-03)**:中英文共 **41 档**头部播客——中文 19 档、英文 22 档,覆盖科技 / 商业 / 财经 / 文化 / 新闻 / 科学 / 喜剧 / 生活各主赛道。
- **后续路线**:按同一模板持续扩充(详见 [`podcasts/README.md`](./podcasts/README.md))——补齐 true-crime、history、education、kids 等垂类,以及长尾小众精品。

## 编写原则(摘要)

1. **Markdown 优先** —— 语料库以可读 Markdown 为主体;工具与脚本为辅,归档在 `tools/`。
2. **只写确凿事实** —— 名称、主播、出品方、平台、年代、定位正常写。
3. **不确定的留 `TODO`** —— 易变 / 难核实信息(订阅数、最新单集、精确 RSS URL、近期排名)标 `TODO`,不编造。
4. **代表单集选能体现节目风格的**,不必追最新。
5. **保持中立**,不做营销口吻。

完整规范见 [`podcasts/README.md`](./podcasts/README.md)。

## 仓库结构

```
.
├── README.md           ← 本文件(语料库入口)
├── .gitignore
├── podcasts/           ← 语料库主体(Markdown)
│   ├── README.md       结构 / 字段 / 原则 / 路线
│   ├── _template.md    标准档模板
│   ├── zh/             中文播客(按赛道分目录)
│   └── en/             英文播客(按赛道分目录)
└── tools/              ← LeetCast 历史代码归档(不再维护)
    └── ARCHIVE.md      归档说明
```

## 关于 `tools/`

[`tools/`](./tools/) 下的 LeetCast 工程代码(原仓库主体)已于 2026-08-03 归档,不再维护 / 构建。其中含一个 `transcribe` 命令(把 Apple Podcasts / RSS 音频经阿里云通义听悟转写为本地 Markdown),是语料库未来**可能**用到的辅助工具,但语料库本身不依赖该代码运行。详见 [`tools/ARCHIVE.md`](./tools/ARCHIVE.md)。

## 贡献

复制 `podcasts/_template.md` 到对应 `zh|en/<category>/<slug>.md`,填字段(不确定项标 `TODO`),提交 `docs: add <播客名>`。

---

License: 见 [`tools/LICENSE`](./tools/LICENSE)(随 LeetCast 归档保留)。
