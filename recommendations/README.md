# Recommendations · 每日推荐索引

> 存放 **每日 cron 任务「全网热门播客盘点」生成的索引文件**。
> 语料库主体在 `../podcasts/`(一档一 Markdown 原则),本目录**只放索引**,不重复单档内容。

---

## 这是什么

`recommendations/` 目录由 **每日 cron 任务** 自动维护,文件名格式 `YYYY-MM-DD.md`,内容是当日推荐的**短索引**。每条推荐**直接跳转到语料库原档**获取详情。

## 核心原则:**融合安置**(Fused Sourcing)

**不重复造档 / 不堆在一个 md / 内容回写原档** ——

| 情况 | 动作 |
|------|------|
| 推荐对象**已是 deep 档**(`status: active/ended/hiatus`) | 不建新档;若有**新事实**(2026 年新单集 / 新嘉宾 / 新获奖 / 重大变动),**回写到 `podcasts/<lang>/<category>/<slug>.md` 原档**,推进 `updated_date` |
| 推荐对象**是 stub**(`status: todo`) | 升级为 deep 档:填字段、写简介、列代表单集,在 `podcasts/<lang>/<category>/<slug>.md` 原位完成 |
| 推荐对象**是真正的新档**(语料库从未收录) | 先建 stub 占位:`status: todo`,等下一批次调研后再升级;不要为了赶 cron 在 `recommendations/` 写大段内容 |
| 当日**无新增事实** | 仅生成短索引文件;不回写原档;不编造内容 |

> **核心要求**:每次更新的内容**不放在一个 md**、必须**融入项目文件夹中妥善安置**。这条要求**是 cron 任务的工作流硬约束**,2026-08-05 由用户明确提出,适用于本目录所有 `YYYY-MM-DD.md` 文件。

## 文件命名

```
recommendations/
├── README.md                ← 本文件
├── 2026-08-05.md           ← 短索引(14 档一行 + 跳转)
├── 2026-08-06.md           ← 短索引
├── ...
```

## 短索引文件结构

每份 `YYYY-MM-DD.md` 应包含:

1. **frontmatter**(`title` / `date` / `type: daily-picks-index` / `author` / `language_cover` / `categories` / `source_corpus` / `verification` / `total_picks` / `related_cron_task`)
2. **表头声明**:本文件仅是索引,详情见原档
3. **今日 N 档表格**:每档一行,字段 = 节目 / 主播 / 赛道 / 原档路径链接
4. **一句话总结**:今日 1-3 条核心趋势
5. **趋势来源**:本次 web_search 验证到的 2026 年关键事实(3-5 条)
6. **当日动作**:✅ 无需新建 / ⚠️ 待回写 / 📅 下一份索引日期

**严禁**在索引文件里复述以下内容(必须跳转到原档):
- 主播背景 / 履历
- 节目形式 / 频率 / 时长
- 完整精彩单集列表
- 完整订阅地址
- 影响力评测

## 工作流触发

由 `mavis cron` 配置的定时任务触发,任务描述(系统级):

> 本机 `/Document/Github/allengaller/podcast-database` 全面获取最新全网的各类热门播客,优质播客,给出推荐原因,给出精彩节目名称,给出播放地址。

**任务执行方应遵循的工作流要求**(本 README 即为该工作流的规范文档):

1. **优先用 deep 档**:从 74 档 full 中选;不要为了凑数把 stub 档放进推荐
2. **新事实回写原档**:通过 web_search 验证到的 2026 年新事实,必须回写到 `podcasts/` 对应原档,推进 `updated_date`,不堆在 `recommendations/`
3. **新档先 stub**:遇到真正全新的节目,在 `podcasts/<lang>/<category>/<slug>.md` 建 `status: todo` stub,不在 `recommendations/` 写大段内容
4. **索引短而精**:每日索引不超过 ~80 行表格 + 趋势摘要,不重复原档
5. **不编造**:订阅数 / 最新单集排名 / 收听数据一律标 TODO 或留空,绝不编造
6. **真实可访问**:所有订阅地址使用平台官方 URL(Apple Podcasts / Spotify / 小宇宙 / YouTube / 节目官网),不臆造
7. **跨语种覆盖**:中英文都要覆盖(用户偏好"双维度",与 `global-goodnews` 工作流一致)
8. **赛道平衡**:覆盖 6 个以上赛道,避免某次全是 AI 类

## 与 `podcasts/` 的关系

- `podcasts/` 是**主体语料库**—— 一档一 Markdown
- `recommendations/` 是**索引层**—— 每日热点的快速浏览
- 增量更新**始终回写 `podcasts/`**;`recommendations/` 永远只是"今日跳转列表"
- `podcasts/README.md` 的"当前进度"区需要定期追加新批次(如「每日 cron 索引批次 1 / 2 / 3...」),让语料库总览能体现 cron 维护节奏

## 历史

- **2026-08-05 起点**:用户首次明确提出"融合安置"工作流,删除原堆砌型 `2026-08-05-daily-picks.md`,改为短索引 + 流程规范
- 本目录后续由 cron 自动增量维护
