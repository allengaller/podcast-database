# 全网热点播客深度研究语料库

> 一个以 **Markdown 为主** 的播客赛道研究语料库:逐档记录全网(中文 + 英文)头部播客的定位、主播、形式、受众、代表单集与影响力,供内容研究、对标分析、选题参考。

本仓库原为 LeetCast 工程代码,现已转型为播客研究语料库。历史代码归档于 [`tools/`](../tools/)(见 [`tools/ARCHIVE.md`](../tools/ARCHIVE.md)),不再维护。

---

## 目录结构

```
podcasts/
├── README.md          ← 本文件
├── _template.md       ← 标准档模板(每档播客一个 Markdown,照此填写)
├── zh/                ← 中文播客
│   ├── ai/            AI / 大模型          (4 档)
│   ├── tech/          科技 / 互联网         (10 档)
│   ├── business/      商业 / 创业         (8 档)
│   ├── finance/       财经 / 投资          (2 档)
│   ├── culture/       文化 / 人文          (7 档)
│   ├── news/          新闻 / 时政          (2 档)
│   ├── life/          生活 / 喜剧 / 自我成长 (9 档)
│   └── story/         罪案 / 悬疑 / 历史     (6 档)
└── en/                ← 英文 / 国际播客
    ├── ai/            AI / 大模型          (11 档)
    ├── tech/          科技 / 风投          (14 档)
    ├── business/      商业 / 创业          (8 档)
    ├── news/          新闻 / 时政          (9 档)
    ├── science/       科学 / 科普          (7 档)
    ├── culture/       文化 / 访谈          (8 档)
    ├── comedy/        喜剧 / 娱乐          (9 档)
    ├── true-crime/    真实犯罪            (6 档)
    ├── history/       历史               (6 档)
    ├── education/     教育 / 知识          (4 档)
    └── health/        健康 / 健身          (3 档)
```

> 目录后数字为当前档数(截至 2026-08-03)。每个分类含「已收录(full)」和「待收录(stub,`status: todo`)」两类,详见下方「编写原则」与「当前进度」。

**一条规则:一个播客一个 Markdown 文件。** 文件名用英文 slug(如 `acquired.md`、`keji-zao-zhidao.md`),放在对应语言 + 赛道的目录下。跨赛道的节目按**主赛道**归类,在 frontmatter `tags` 里补次要标签。

## 字段规范

每档播客按 [`_template.md`](./_template.md) 填写。核心 frontmatter 字段:

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | ✅ | 播客原名(中英文) |
| `slug` | ✅ | 英文小写连字符 slug,与文件名一致 |
| `language` | ✅ | `zh` / `en` |
| `category` | ✅ | 与所在目录的赛道一致 |
| `status` | ✅ | `active`(在更)/ `ended`(完结)/ `hiatus`(暂停)/ `todo`(仅占位 stub,细节待核实) |
| `network` | ✅ | 出品方 / 播客网络(独立出品写"独立") |
| `hosts` | ✅ | 主播数组,可附身份简注 |
| `platforms` | ✅ | 分发平台(Apple / Spotify / 小宇宙 / YouTube 等) |
| `rss` | ➖ | RSS 链接,不确定填 `TODO` |
| `subscribe_links` | ➖ | 各平台精确订阅链接,不确定填 `TODO` |
| `added_date` / `updated_date` | ✅ | 条目维护日期 |
| `tags` | ✅ | 关键词数组,含次要赛道 |

## 编写原则(重要)

1. **Markdown 优先** —— 本语料库以可读、可检索的 Markdown 为主体。工具与脚本是为语料库服务的辅助,放在 [`tools/`](../tools/)。
2. **只写确凿事实** —— 名称、主播、出品方、平台、大致年代、内容定位这类稳定事实正常写。
3. **不确定的留 `TODO`** —— 具体订阅数、最新单集、精确 RSS URL、近期排名这类易变 / 难核实信息,标 `TODO` 而非编造。每篇末尾的「资料来源 / 待核」区块汇总待核实项。
4. **代表单集选能体现节目风格的** —— 不必追最新,优先选知名度高、能代表节目定位的。
5. **保持中立** —— 描述定位与影响力,不做营销口吻。
6. **Stub 条目** —— 对于知名度高但当前尚未核实细节的节目,**先建 stub 文件占位**:`status: todo`,frontmatter 仅填 `title`/`slug`/`language`/`category`/`status: todo`,正文写"待收录,欢迎补充"。已收录(`status` 非 `todo`)的条目视为已核实。**绝不为了凑数而编造主播、出品方或代表单集。**

## 当前进度

- **批次 1(2026-08-03)**:中英文共 **41 档**已收录(full)头部播客,每档完整字段。
- **批次 2(2026-08-03)**:遍历各分类扩充 + 新增垂类——中文新增 `story/`(罪案/历史),英文新增 `true-crime/`、`history/`、`education/`、`health/`。共补 **77 档 stub**(`status: todo`,仅占位、细节待核实,欢迎补充)。
- **当前合计**:**117 档**(中文 44 + 英文 73)。各分类档数见上方「目录结构」。
- **后续路线**:持续把 stub 升级为 full 条目(逐档核实主播/出品/形式/代表单集),并继续补长尾与小众精品。

## 贡献方式

1. 复制 `_template.md` 到对应 `zh|en/<category>/` 目录,文件名用 slug。
2. 填写字段;不确定项标 `TODO`。
3. frontmatter 必须是合法 YAML;正文用 Markdown。
4. 提交信息建议:`docs: add <播客名>` 或 `docs: update <播客名>`。

## 与 tools/ 的关系

[`tools/`](../tools/) 下的 LeetCast 工程含一个 `transcribe` 命令(把 Apple Podcasts / RSS 音频经阿里云通义听悟转写为本地 Markdown)。它是语料库未来**可能**用到的辅助工具之一,但语料库本身以人工 / 半自动整理为主,不依赖该代码运行。
