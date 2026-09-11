# 批次 11 · 田野调查播客专项 · 设计文档

- **日期**：2026-09-09
- **作者**：Mavis（设计草稿,待用户确认后落实入库）
- **状态**：草案 → 待审 → 实施

---

## 1. 背景与目标

用户即将开展 **为期 2 年的田野调查**,需要一个长期可积累的「访谈类 + 田野调查类」播客阅读/聆听清单,以:

1. **方法论准备** —— 了解国际/国内「非虚构叙事」「口述史」「驻场式报道」等成熟范式的标准做法
2. **跨行业案例库** —— 在不同行业的田野前先听一遍「别人怎么做的」,减少方法试错成本

本仓库（podcast-database）已沉淀 184 档中英文头部播客(100 deep + 84 stub),但**没有一个围绕「田野调查 / 访谈方法论」组织的子集**。本批次补齐这一缺口。

---

## 2. 设计取舍

| 维度 | 决策 | 理由 |
| --- | --- | --- |
| 批次规模 | **8 档新 stub** | 用户选定「10-15 档中等规模」,但候选筛选后精简到 8 档高质量而非凑数 |
| 中英比例 | **4 中文 + 4 英文** | 用户做中文田野,但方法论范本几乎全在英文,均衡覆盖 |
| 类目分布 | **zh 全部 culture,en 3 culture + 1 news** | 田野调查+访谈类的天然归类就在文化/新闻;不强插其他赛道 |
| 是否升级现有 stub | **本轮不升级** | 用户明确「不升级任何 stub」;岩中花述 / 言外之易 / 涟漪效应留批次 12 |
| 是否新增 category | **不新增** | tags 标记足够检索;新增类目会牵动 11 个 doc 文件,性价比低 |
| tags 关键词 | `田野调查` / `field-research` + 角色标签(`方法论范本` / `行业案例`) + 风格标签 | 跨语言统一检索;角色标签便于两年后按需筛选 |

---

## 3. 入库清单

### 3.1 中文新 stub（4 档 · zh/culture）

| # | 节目 | slug | 角色 | 备注 |
| --- | --- | --- | --- | --- |
| 1 | 真实故事 | `zhen-shi-gu-shi` | 行业案例·口述史 | 前身「真实故事计划」;腾讯/独立,文学化口述史,代表作《太平洋大逃杀》亲历者亲述 |
| 2 | 谷雨实验室 | `gu-yu-shi-yan-shi` | 行业案例·调查报道 | 腾讯新闻旗下,调查记者驻站式非虚构;「谷雨奖」获奖项目集中地 |
| 3 | 正午 | `zheng-wu` | 行业案例·非虚构 | 前媒体人郭玉洁团队,人物类长报道 |
| 4 | GQ报道 / GQ Talk | `gq-bao-dao` | 行业案例·人物长访谈 | 康泰纳仕中国,商业+文化+热点人物 |

### 3.2 英文新 stub（4 档 · en/culture ×3 + en/news ×1）

| # | 节目 | slug | 类别 | 角色 | 备注 |
| --- | --- | --- | --- | --- | --- |
| 5 | This American Life | `this-american-life` | en/culture | 方法论范本·叙事非虚构 | Ira Glass / WBEZ;叙事非虚构教科书,每周 5-7 段嵌入现场录音 |
| 6 | Ear Hustle | `ear-hustle` | en/culture | 方法论范本·驻场田野 | Earlonne Woods + Nigel Poor / Radiotopia;San Quentin 监狱内驻场报道 8+ 年 |
| 7 | The Moth | `the-moth` | en/culture | 行业案例·口述史 | 现场 + 广播双轨;全球最知名的真实故事舞台 |
| 8 | Reveal | `reveal` | en/news | 方法论范本·调查报道 | Center for Investigative Reporting / PRX;环境/劳工/警政/医疗跨行业调查库 |

---

## 4. Frontmatter 标签约定

每个新 stub 的 `tags` 数组至少包含 3 个标签(按顺序):

1. **分类关键词**:`田野调查`(中文档)或 `field-research`(英文档),二选一
2. **角色**:`方法论范本` 或 `行业案例`,二选一
3. **风格**:**至少 1 个**,从下面选:
   - `口述史` / `oral-history`
   - `非虚构叙事` / `narrative-nonfiction`
   - `调查报道` / `investigative-reporting`
   - `驻场式` / `embedded`
   - `现场录音` / `scene-tape`
   - `长访谈` / `longform-interview`
   - `人物特写` / `profile`

完整示例(以 This American Life 为例):

```yaml
tags:
  - field-research
  - 方法论范本
  - narrative-nonfiction
  - scene-tape
  - longform-interview
```

---

## 5. 工作流

```
1. 直接跑 scripts/make-stub.py 生成 8 个 stub 文件
   - 全部用 --slug= 显式指定 slug(中文标题默认无法生成可读 slug)
   - 全部走 path 安全校验

2. 手工补充 tags(每档至少 3 个标签)
   - 使用 Edit 工具在生成的 frontmatter 中加入 tags
   - tags 加在 added_date / updated_date 之后,与现有 stub 一致

3. 跑 scripts/validate_corpus.py
   - 校验 frontmatter / slug 唯一 / 日期

4. 跑 scripts/stats.py
   - 刷新 INDEX.md 和 podcasts/README.md 的统计区

5. 跑 scripts/export.py
   - 生成 dist/podcasts.json 和 dist/podcasts.csv

6. 不自动 commit
   - 本地 diff 给用户过目后再决定是否入库
```

---

## 6. 不动的东西（显式边界）

- **schema / _template.md** —— 不变
- **podcasts/README.md** —— 不修改主结构(只让 stats.py 自动刷新统计段)
- **validate/stats/export 脚本** —— 不修改
- **现有 184 档的元数据** ——完全不触碰(岩中花述 / 言外之易 / 涟漪效应 留作批次 12)
- **新增 category** —— 不新增 field-research / methodology 类目
- **新增顶层 doc** —— 不在 docs/ 下新增任何文件(本 spec 是唯一的元文档)

---

## 7. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| 候选名拼写/事实错误 | 行业常识级候选,本批次不联网核实;若发现错误,直接编辑 stub frontmatter 的 `title` 字段 |
| 与已有档冲突 | make-stub.py 会跳过同名 slug;如果发现重复,以现有档为准 |
| slug 不规范 | 全部用 `--slug=` 显式指定,不走自动 slugify |
| CI 失败 | validate/stats/export 三个脚本任一失败,回滚所有 stub 文件(git restore) |

---

## 8. 后续路线（不属本批次）

- **批次 12 候选**(留档不触动):
  - 升级 3 档:岩中花述 / 言外之易 / 涟漪效应(用户已确认要升级)
  - 可继续补充英文方法论范本:`S-Town` `Heavyweight` `Reply All` `Song Exploder` `StoryCorps` `Hidden Brain` 升级
  - 中文补充:`单读·吴琦`（与「螺丝在拧紧」重叠,可合并）`端传媒 podcast`(可能停更) `梁文道·八分`(已停)
- **docs/FIELDRESEARCH-RESOURCES.md**:在积累 15-20 档后,做一份长期导引 doc 串起所有田野调查相关档(本轮不做)
- **后续每轮节奏**:用户定「中等规模,多轮」,建议每 2-3 周补一批 6-10 档,直到覆盖度满意

---

## 9. 验收标准

✅ 8 个新 stub 文件已生成
✅ 全部 frontmatter 完整(含 tags)
✅ `python3 scripts/validate_corpus.py` 退出码 0
✅ `python3 scripts/stats.py` 退出码 0,统计段显示 8 档新增
✅ `python3 scripts/export.py` 退出码 0
✅ INDEX.md 已自动刷新,新档可见
✅ 本地 diff 已给用户过目
