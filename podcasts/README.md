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
│   ├── ai/            AI / 大模型          (13 档)
│   ├── tech/          科技 / 互联网         (10 档)
│   ├── business/      商业 / 创业         (8 档)
│   ├── finance/       财经 / 投资          (2 档)
│   ├── culture/       文化 / 人文          (7 档)
│   ├── news/          新闻 / 时政          (2 档)
│   ├── life/          生活 / 喜剧 / 自我成长 (9 档)
│   └── story/         罪案 / 悬疑 / 历史     (6 档)
└── en/                ← 英文 / 国际播客
    ├── ai/            AI / 大模型          (18 档)
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
- **批次 3(2026-08-04)**:**AI 类加强** —— 中文 AI 2 档 + 英文 AI 10 档 stub 升级为深档 full,字段密度对齐示范批,严格遵守"不确定留 TODO,不编造订阅数"原则。
  - 中文升级为深档:`AI 每周谈`、`原点 Talk`
  - 英文升级为深档:`Latent Space`、`Dwarkesh Podcast`、`No Priors`、`AI Daily Brief`、`Gradient Dissent`、`Last Week in AI`、`Practical AI`、`The AI Podcast (NVIDIA)`、`The Cognitive Revolution`、`The TWIML AI Podcast`
  - 英文 `High Agency` 字段多为 TODO + 重要提示,信息可信度低,需以平台名片页核实为准
- **批次 4(2026-08-04 / 05)**:**AI 类第二批加强(方案 B 全量 10 档)** —— 基于候选清单(7 中文 + 7 英文)按"必收 5 + 强烈建议 5"实际抓取并写入深档。
  - 中文新增 5 档(必收 3 + 强烈建议 2):
    - 必收:`晚点聊 LateTalk` / `智能涌现` / `AI 早知道` —— 中文 AI 长访谈 / 新闻速递 / 嘉宾访谈的头部代表
    - 强烈建议:`老石谈芯`(中科院副研究员 + 帝国理工博士,中文芯片科普头部 IP)/ `钱皓频道`(VC 视角互联网 / AI / 电商自媒体头部)
  - 英文新增 5 档(必收 2 + 强烈建议 3):
    - 必收:`Lex Fridman Podcast`(全球 AI 长访谈 NO.1,MIT 研究员主持)/ `Hard Fork`(NYT 旗下,凯文·鲁斯 + 凯西·牛顿主理)
    - 强烈建议:`Eye on AI`(前 NYT 记者 Jack Lindsay 一对一深度访谈)/ `Data Skeptic`(2014 年开播,数据科学 / AI 入门 + 进阶双轨)/ `Me, Myself, and AI`(MIT SMR + BCG 联合出品,企业级 AI 落地访谈)
  - **本批次总档数**:AI 类从 15 档 → 25 档(中文 4 → 9,英文 11 → 16),所有新增条目均按深档标准填写,不确定字段统一标 TODO
- **批次 5(2026-08-05)**:**AI 类第三批加强——中文 4 档候选全量入库**。基于候选清单中"用户最想收"的中文 4 档实际抓取并写入深档。
  - 新增 4 档(全部为中文):
    - `半拿铁 | 商业沉浮录`(刘飞 + 潇磊)——中文商业故事播客天花板,2023 年喜马拉雅中文商业评论榜上榜,小宇宙订阅 23.8 万,以"说相声讲商业"的差异化打法
    - `What's Next | 科技早知道`(原「硅谷早知道」,徐涛 / 丁教 / 声动活泼)——中文"硅谷视角科技播客"开创节目,Apple Podcasts ID 1361458105
    - `硬地骇客`(三位 10 年+互联网创业者团队)——中文 Indie Hacker 头部,自有产品 Podwise + 开源电子书 + 知识星球,聚焦"AI 时代超级个体 / 独立开发"
    - `王煜全前哨`(王煜全 / 海银资本 / 得到 APP)——得到 APP 头部科技 IP,核心方法论"积木式创新",覆盖全球科技趋势 + 投资 + 出海
  - **本批次总档数**:AI 类从 25 档 → 29 档(中文 9 → 13,英文 16 不变)
- **批次 6(2026-08-05)**:**AI 类第四批加强——"补 + 收" 3 档**。回应候选清单中"用户本来想收"的 AI 头部,补 1 档中文 + 收 2 档英文头部。
  - 新增 3 档(净增 2 档,因为 1 档是 stub 升级):
    - `十字路口 Crossing`(Koji 杨远骋 / Ronghui)——中文 AI 头部,获小宇宙「年度新播客」+「年度趋势播客(前沿科技)」双项大奖,运营 AI Hacker House + 中文 AI 创业社群(原 `shi-zi-lu-kou` stub 升级为深档,净增 0 档)
    - `In Machines We Trust`(MIT Technology Review / Jennifer Strong)——英文"严肃新闻 + AI 社会影响"代表,2020 Front Page Award,Apple Tech 榜 #1
    - `Robot Brains Podcast`(Pieter Abbeel / UC Berkeley)——英文 AI + 机器人深度访谈天花板,ACM Prize in Computing 2021 得主主持
  - **本批次总档数**:AI 类从 29 档 → 31 档(中文 13 不变,英文 16 → 18)
  - **淘汰候选**:Acquired AI 特别篇(商业播客,非 AI 分类)/ Hardcore History 科技专题(历史播客,非 AI 分类)——不归 AI 分类
- **批次 7(2026-08-05)**:**AI 类收官 + 跨入 en/business 头批**。AI 类仅剩的 1 档 stub 升级为深档,同时把 en/business 全 stub 类目一次性升级头牌 5 档。
  - 升级 / 抓取 6 档(净增 0 档):
    - `AI BigBang 大爆炸`(zh/ai 唯一 stub → 深档 66 行)
    - `How I Built This with Guy Raz`(en/business 单薄版 → 深档,2016-09 NPR / Wondery 上线)
    - `Masters of Scale with Reid Hoffman`(en/business 单薄版 → 深档,2017 WaitWhat / LinkedIn 上线)
    - `Indie Hackers`(en/business 纯 stub → 深档,Courtland & Channing Allen)
    - `a16z Podcast`(en/business 单薄版 → 深档,Sonal Chokshi 主编,5+ feed 网络)
    - `SaaStr Podcast`(en/business 纯 stub → 深档,Jason Lemkin 主理 + SaaStr Annual / SaaStr AI London 矩阵)
  - **本批次总档数**:**总档数不变**(zh/ai 13 档全部升级为深档,en/business 8 档中 5 档升级为深档,剩 3 档 stub:`b2b-growth` / `founder-s-journal` / `office-hours-with-patrick-o-shaughnessy`)。**深档 +6,stub -6**
  - **en/business 类目进度**:8 档中 5 档(How I Built This / Masters of Scale / a16z Podcast / Indie Hackers / SaaStr)升级为深档,3 档 stub 待办:`b2b-growth` / `founder-s-journal` / `office-hours-with-patrick-o-shaughnessy`
  - **AI 类里程碑**:`zh/ai` 13 档全部为深档,`en/ai` 18 档全部为深档,合计 AI 类 31 档全深档,AI 类整体收官
- **当前合计**:**165 档**(中文 63 + 英文 102),其中深档 full **79 档**、stub **86 档**。各分类档数见上方「目录结构」。
- **每日 cron 推荐(2026-08-05 启动)**:系统 cron 任务(描述:"本机 `/Document/Github/allengaller/podcast-database` 全面获取最新全网的各类热门播客")每日触发,**输出在 [`../recommendations/`](../recommendations/)**——只放短索引 `YYYY-MM-DD.md`,不重复造档。**工作流要求见 [`../recommendations/README.md`](../recommendations/README.md)「融合安置」原则:推荐对象已是 deep 档 → 不建新档;有 2026 年新事实 → 回写 `podcasts/<lang>/<category>/<slug>.md` 原档并推进 `updated_date`;真正新档 → 先建 stub 占位。**当日无新增事实时,仅生成短索引,**不强行回写**。首份索引 [`../recommendations/2026-08-05.md`](../recommendations/2026-08-05.md) 精选 14 档(全为 deep 档,无新增事实 → 原档未触动)。
- **批次 8(2026-08-05 cron)**:Forbes 2026-07-30「收入最高播客主持人」榜单 + 2026 学术研究双重验证,共触动 20 档:
  - **回写 4 档 active 深档** Forbes 2026 收入数据(推进 `updated_date` 到 2026-08-05):
    - `The Joe Rogan Experience`(en/comedy) — Forbes 2026 #1, **$82M**
    - `SmartLess`(en/comedy) — Forbes 2026 #5, **$37M**
    - `The Diary of a CEO`(en/culture) — Forbes 2026 #3, **$45M**
    - `Huberman Lab`(en/science) — Forbes 2026 #18, **$18M**
  - **升级 5 档 stub → 深档**(填完整字段 + 加 Forbes 数据):
    - `The Bill Simmons Podcast`(en/comedy) — Forbes 2026 #13, **$22M**
    - `Armchair Expert`(en/culture) — Forbes 2026 #11, **$25M**
    - `On Purpose with Jay Shetty`(en/culture) — Forbes 2026 #14, **$21M**
    - `Pod Save America`(en/news) — Forbes 2026 #9, **$28M**
    - `Crime Junkie`(en/true-crime) — Forbes 2026 #4, **$42M**
  - **建 10 档新 stub**(Forbes 2026 收入榜上语料库无的):
    - en/business:`TBPN`(OpenAI 2026-04 以 $150M 收购)、`The Prof G Pod`(Vox Media 续约 7:3 分成)
    - en/culture:`The Mel Robbins Podcast`、`Call Her Daddy`、`The Breakfast Club`、`The Joe Budden Podcast`、`Giggly Squad`
    - en/news:`New Heights`、`Pardon My Take`、`The Tucker Carlson Show`
  - **建 6 档新 stub**(2026 学术研究《新闻世界》2025-10 点名的中文书业头部):`看理想圆桌` / `没理想编辑部` / `跳岛FM` / `螺丝在拧紧` / `读库立体声` / `Talk三联`(全部归 zh/culture)
  - **本批次净增 16 档**(10 英文 Forbes + 6 中文书业,5 档 stub 升级为深档)。**深档 +5(74→79),stub +11(75→86),总档数 +16(149→165)**
- **后续路线**:① 继续把高优先级 stub 升级为深档 full(en/business 剩 3 档 + 大量 en/tech / en/news / en/comedy / en/culture / en/education / en/health / en/history / en/true-crime 等);② 跨类目研究 AI / 科技 / 商业之间的节目迁移(可考虑将「Acquired」放入英文 business 分类、「Hardcore History」放入英文 history 分类);③ 继续延展"中英头部播客全档覆盖"目标;④ AI 类已收官(zh/ai 13 + en/ai 18 全深档),后续 AI 类仅做字段更新与小型 stub 收尾;⑤ **每日 cron 索引**作为常态化资产持续累积,索引文件按 `YYYY-MM-DD.md` 命名,内容与 `recommendations/README.md` 工作流保持一致;⑥ 批次 8 新增的 16 档 stub 等下一批次(8-06 cron)起按优先级升级为深档(TBPN / On Purpose / New Heights 优先,中文书业 6 档第二批)。

## 贡献方式

1. 复制 `_template.md` 到对应 `zh|en/<category>/` 目录,文件名用 slug。
2. 填写字段;不确定项标 `TODO`。
3. frontmatter 必须是合法 YAML;正文用 Markdown。
4. 提交信息建议:`docs: add <播客名>` 或 `docs: update <播客名>`。

## 与 tools/ 的关系

[`tools/`](../tools/) 下的 LeetCast 工程含一个 `transcribe` 命令(把 Apple Podcasts / RSS 音频经阿里云通义听悟转写为本地 Markdown)。它是语料库未来**可能**用到的辅助工具之一,但语料库本身以人工 / 半自动整理为主,不依赖该代码运行。
