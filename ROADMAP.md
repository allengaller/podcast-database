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
| 10 | 每日 cron 盘点:外部 Mavis cron 2026-09-04 已恢复产出(本日索引 + 25 stub 已收编入库);为避免双写,暂不在本工作区重复建档,执行器迁移待决策 | ⏸ |
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

- **每日 cron 执行器**:Mavis 外部 cron(现状,2026-09-04 已恢复产出)vs 迁移至本工作区自动化 —— 二选一,避免双写
- **zh 薄类目处理**:finance/news 档位偏少,扩充还是合并
- **数据 License**:是否采用 CC BY 4.0
- ~~dist/ 是否随仓库发布~~ 已定:提交 JSON/CSV,CI 校验新鲜度

## 执行记录

- **2026-09-04**:本路线图沉淀并当日执行完毕 —— P0 全量完成;批次 9 完成(16 档升级深档 / 7 档去重 / 收编 25 档 cron 遗留,全库 **186 档 / 92 deep / 94 stub**);P2#12 导出管线提前落地;cron 执行器决策待定(见上)。详细结果见当日 git log 与 `podcasts/README.md`「当前进度」。
- **2026-09-05**:批次 10 完成 —— 8 档升级深档(罗永浩的十字路口 / 陈鲁豫·慢谈 / 张小珺商业访谈录 / 声动早咖啡 / 面基 / B2B Growth / Founder's Journal / Stratechery),删除 2 档误档(office-hours-with-patrick-o-shaughnessy、zh/tech 声动早咖啡重复 stub);**深档突破 100**,全库 **184 档 / deep 100 / stub 84**;zh/finance 全深档,zh/news 深档破零。批次 11 候选已列入 `podcasts/README.md`「后续路线」。
