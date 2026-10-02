# ROADMAP · 语料库发展路线图

> 2026-09-04 整体评估后沉淀的发展路线。P0/P1 为本日执行批次,P2/P3 为后续计划。
> 状态标记:✅ 已完成 · 🔜 计划中 · ⏸ 待用户决策

---

## 现状事实(2026-09-04 核对)

1. **仓库已转型**:LeetCast 代码归档于 `tools/`(commit `0bf8073`),主体为播客研究语料库;`feat/podcast-corpus-repurpose` 分支领先 main 9 个提交,**尚未合并**。
2. **「每日 cron 推荐」停摆一个月**:`recommendations/` 仅有 2026-08-05 一份索引,README 中"常态化资产持续累积"为空头声明。
3. **stub 占比 52%**(86/165):批次 8 新建的 16 档 stub(TBPN、New Heights、中文书业 6 档等)尚未升级;README 目录树数字停留在 2026-08-03,已与实际漂移。
4. 8 月 21 日发生过 `" 2.md"` 重复文件误提交事故(两天后手动清理)——缺自动校验的直接证据。

---

## P0 · 转型落袋(本日执行)

| # | 事项 | 状态 |
| --- | --- | --- |
| 1 | 仓库卫生:删 `test-results/` 残留、untrack `.video_agent/plugin_root`、清 `.DS_Store`、收紧 `.gitignore` | ✅ |
| 2 | `scripts/validate_corpus.py`:frontmatter / slug / 目录一致 / 日期 / 重复文件名校验 | ✅ |
| 3 | `scripts/stats.py`:统计生成器,自动回写 README 目录树与「当前合计」(HTML 注释标记,幂等),并生成 `podcasts/INDEX.md` 总索引 | ✅ |
| 4 | `scripts/export.py`:导出 `dist/podcasts.json` / `podcasts.csv`(机器可读层) | ✅ |
| 5 | GitHub Actions CI:PR / push 时跑校验 + 统计新鲜度检查 | ✅ |
| 6 | 修复 `scripts/make-stub.py`:硬编码日期 → 动态日期;中文标题强制要求 `--slug` | ✅ |
| 7 | 关闭 13 个 dependabot 遗留 PR(全部指向已归档 `tools/` 代码) | ✅ |
| 8 | 合并 `feat/podcast-corpus-repurpose` → main(本地合并不推送) | ✅ |

## P1 · 让语料库活起来(本日启动)

| # | 事项 | 状态 |
| --- | --- | --- |
| 9 | 批次 9:批次 8 遗留的 16 档 stub 升级为深档(TBPN / New Heights / Pardon My Take / Prof G / 英文文化 5 档 / Tucker Carlson / 中文书业 6 档);核实不了的如实留 stub,不编造 | ✅ |
| 10 | 每日 cron 盘点:执行器已定为本仓 `cron-daily` 工作流;2026-09-22 起停用每日空骨架自动提交(连续 11+ 天 total_picks: 0),改为手动触发,待回填机制建立后恢复 schedule | ✅ 2026-09-22 |
| 11 | 中文薄类目(zh/finance 2 档、zh/news 2 档):扩充至 5+ 或并入相邻类目 | ⏸ 待决策 |

## P2 · 从语料走向资产(本季度)

| # | 事项 | 状态 |
| --- | --- | --- |
| 12 | JSON/CSV 导出管线(已落地 `scripts/export.py` + `dist/podcasts.{json,csv}`)→ 后续接静态站 / API 再扩展 | ✅ |
| 13 | License 拆分:数据部分改 CC BY 4.0,`tools/` 代码保留原协议 | ⏸ 待决策 |
| 14 | GTM 季度复盘(到期 2026-09-29):先把页面中 `※ 待核实/假设` 数字换成真实来源 | 🔜 |
| 15 | 批次 10+:批次 2 遗留英文 stub(`b2b-growth` / `founder-s-journal` / `office-hours-*` 等)按类目逐批升级 | 🔜 |

## P3 · 机会型(差异化壁垒)

| # | 事项 | 状态 |
| --- | --- | --- |
| 16 | 单集层语料:复活归档的 `transcribe` 命令(yt-dlp → 通义听悟 → Markdown),把语料库下沉到"单集级别";注意版权合规,先限私有研究 | 🔜 |

---

## 待决策事项(需要用户拍板)

- ~~每日 cron 执行器~~ 已定:本仓 `cron-daily` 工作流;2026-09-22 停用每日自动提交(见 P1#10)
- **zh 4 个薄类目收口方案** —— 2026-10-02 评估后拟,详见下方「zh 薄类目方案 v0.1」
- ~~数据 License~~ 已定:数据部分 CC BY 4.0(见根 README License 一节)
- ~~dist/ 是否随仓库发布~~ 已定:提交 JSON/CSV,CI 校验新鲜度(2026-09-22 落实)

---

## zh 薄类目方案 v0.1(2026-10-02 拟,待用户拍板)

### 现状

| 类目 | 文件数 | 深档 | 评估 |
| --- | --- | --- | --- |
| `zh/comedy` | 1 | 0 | 边界类目,唯一档为「多新鲜呐」——是喜剧还是文化见仁见智 |
| `zh/finance` | 2 | 2 | 已深档饱和(风投圈 / 面基),但类目总量偏少 |
| `zh/story` | 6 | 5 | 已基本饱和(罪案 / 悬疑 / 历史),仅 1 档 stub |
| `zh/news` | 5 | 3 | 缺 2 档凑足 5(907 编辑部 / 岛岛连线 / 短文 是 stub) |

### 三套备选

| 方案 | comedy | finance | story | news | 风险 |
| --- | --- | --- | --- | --- | --- |
| **A. 全部扩充** | 补 5+ 档 | 补 3+ 档 | 补 5+ 档 | 补 5+ 档 | 批次成本高,优质候选有限 |
| **B. 全部并入 culture** | 迁移 1 档 | 迁移 2 档 | 迁移 6 档 | 迁移 5 档 | 目录结构简化但 culture 类目过载(40 → 54 档),导航恶化 |
| **C. 混合(推荐)** | 迁移到 culture(1 档) | 保留,批次 11 补 2 档 | 保留(已饱和) | 保留,批次 11 补 2 档 | comedy 单档迁移成本低,其他按需补 |

### 推荐:方案 C 的理由

1. **comedy 1 档边界 case**:「多新鲜呐」实际定位偏脱口秀/文化评论,迁 culture 后类目更清晰;迁完后 zh/comedy 类目可删除
2. **finance 保留但补档**:「面基」「风投圈」已是优质深档;补 2 档即可凑足 5 档(候选:番外 stories / 42章经 / 不动声色等)
3. **story 已饱和**:罪案 / 悬疑 / 历史是有意为之的 niche 主题,不强行扩
4. **news 补档紧迫**:有声动早咖啡(深档)+ Sinica(深档)打底,缺泛科技 / 泛财经新闻类补足

### 执行步骤(方案 C 通过后)

1. **comedy 迁移**:1 档 `duo-xin-xian-na.md` → `zh/culture/`,改 frontmatter `category: culture`,删除 `zh/comedy/` 目录
2. **批次 11 优先补**:
   - zh/finance:2 档(候选名单待勾选,以核实度排序)
   - zh/news:2 档(同上)
3. **联动脚本**:更新 `scripts/validate_corpus.py`(category ↔ 目录一致性)+ `scripts/stats.py`(目录树自动刷新)+ `scripts/export.py`(JSON/CSV 字段同步)
4. **README 与 ROADMAP 同步**:类目规范段修订,统计快照同步更新
5. **后续规则**:某类目再次跌破 5 档时,触发"扩充 or 并入"复审(写入 ROADMAP)

> **本方案当前状态**:`v0.1`,写入 ROADMAP 等待用户拍板;通过后由 `feat/zh-thin-categories-batch11` 分支执行。

## 执行记录

- **2026-09-04**:本路线图沉淀并当日执行完毕 —— P0 全量完成;批次 9 完成(16 档升级深档 / 7 档去重 / 收编 25 档 cron 遗留,全库 **186 档 / 92 deep / 94 stub**);P2#12 导出管线提前落地;cron 执行器决策待定(见上)。详细结果见当日 git log 与 `podcasts/README.md`「当前进度」。
- **2026-09-05**:批次 10 完成 —— 8 档升级深档(罗永浩的十字路口 / 陈鲁豫·慢谈 / 张小珺商业访谈录 / 声动早咖啡 / 面基 / B2B Growth / Founder's Journal / Stratechery),删除 2 档误档(office-hours-with-patrick-o-shaughnessy、zh/tech 声动早咖啡重复 stub);**深档突破 100**,全库 **184 档 / deep 100 / stub 84**;zh/finance 全深档,zh/news 深档破零。批次 11 候选已列入 `podcasts/README.md`「后续路线」。
- **2026-09-22**:整体评估后的三项修复 —— ① corpus-ci 长期红灯修复(根因:全局 `~/.gitignore_global` 的 `dist/` 规则一直挡住导出提交,`git add -f` 收编 `dist/podcasts.{json,csv}`);② 清理 34 个 macOS 复制产生的 " 2" 重复文件(8/21 事故在批次 10 复发,全部与原件逐字节一致),新增 `* 2` ignore 规则防复发;③ 停用 cron 每日空骨架自动提交(改为手动触发)。另:新增 `podcasts/featured/` 置顶学习专题(首批:硅谷101 / This Week in Tech)。
- **2026-10-02**:整体评估 + 收口冲刺 —— ① 评估确认"静默 10 天"为 cron 停摆副作用,启动收口;② 「硅谷101」+ 3 期前沿 AI 单集研读笔记入库(E251 推理芯片之战 / E244 机器人走错路了 / E247 对话盛颖 xAI),覆盖主题线 1(AI 与模型经济);③ TWiT #1102 笔记入库,作为 TWiT 主题首批;④ 「zh 薄类目方案 v0.1」拟稿待用户拍板(comedy 并入 / finance 保留补档 / story 保留 / news 保留补档);⑤ GTM 复盘 v0.2 数据校准(165→231 档);⑥ CRON 推荐回填 2026-09-23 至 2026-10-02 共 10 天。
