# 批次 11 · 田野调查播客专项 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 podcast-database 语料库中入库 8 档「田野调查 / 访谈方法论」相关播客的新 stub(中文 4 档 + 英文 4 档),不触动现有档,跑通 validate/stats/export 三个 CI 脚本,获得用户过目后再 commit。

**Architecture:** 全部走现有 `scripts/make-stub.py` 批量生成 8 个 stub .md 文件,再用 Edit 工具逐个补 tags(每档 3+ 标签),最后跑三个 CI 脚本验证;不动 schema / 模板 / README / 脚本本身。

**Tech Stack:** Python 3 · YAML Frontmatter · existing tools (make-stub.py / validate_corpus.py / stats.py / export.py) · path 安全校验

---

## File Structure

| 操作 | 路径 | 责任 |
| --- | --- | --- |
| Create | `podcasts/zh/culture/zhen-shi-gu-shi.md` | 中文新 stub · 真实故事 |
| Create | `podcasts/zh/culture/gu-yu-shi-yan-shi.md` | 中文新 stub · 谷雨实验室 |
| Create | `podcasts/zh/culture/zheng-wu.md` | 中文新 stub · 正午 |
| Create | `podcasts/zh/culture/gq-bao-dao.md` | 中文新 stub · GQ 报道 |
| Create | `podcasts/en/culture/this-american-life.md` | 英文新 stub · This American Life |
| Create | `podcasts/en/culture/ear-hustle.md` | 英文新 stub · Ear Hustle |
| Create | `podcasts/en/culture/the-moth.md` | 英文新 stub · The Moth |
| Create | `podcasts/en/news/reveal.md` | 英文新 stub · Reveal |
| Modify (auto) | `podcasts/INDEX.md` | 由 stats.py 自动刷新 |
| Modify (auto) | `podcasts/README.md` | 由 stats.py 自动刷新统计段 |
| Modify (auto) | `dist/podcasts.json` | 由 export.py 自动生成 |
| Modify (auto) | `dist/podcasts.csv` | 由 export.py 自动生成 |

每个 stub 文件职责:单一播客的最小占位记录,只有 frontmatter 5 字段 + tags + 「待收录」正文。

---

## Task 1: 生成中文 4 个 stub 文件

**Files:**
- Create: `podcasts/zh/culture/zhen-shi-gu-shi.md`
- Create: `podcasts/zh/culture/gu-yu-shi-yan-shi.md`
- Create: `podcasts/zh/culture/zheng-wu.md`
- Create: `podcasts/zh/culture/gq-bao-dao.md`

- [ ] **Step 1: 跑 make-stub.py 一次生成 4 个中文 stub**

Run from repo root:
```bash
python3 scripts/make-stub.py zh culture \
  --slug=zhen-shi-gu-shi "真实故事" \
  --slug=gu-yu-shi-yan-shi "谷雨实验室" \
  --slug=zheng-wu "正午" \
  --slug=gq-bao-dao "GQ 报道"
```

Expected output (exact):
```
made: podcasts/zh/culture/zhen-shi-gu-shi.md
made: podcasts/zh/culture/gu-yu-shi-yan-shi.md
made: podcasts/zh/culture/zheng-wu.md
made: podcasts/zh/culture/gq-bao-dao.md

made 4, skipped 0, rejected 0
```

Exit code: `0`

- [ ] **Step 2: 验证 4 个文件存在**

Run:
```bash
ls -la podcasts/zh/culture/zhen-shi-gu-shi.md podcasts/zh/culture/gu-yu-shi-yan-shi.md podcasts/zh/culture/zheng-wu.md podcasts/zh/culture/gq-bao-dao.md
```

Expected: 4 个文件,大小大致相同(约 600-700 bytes),modification time 是刚才

- [ ] **Step 3: 检查 1 个文件确认 frontmatter 完整**

Run:
```bash
head -15 podcasts/zh/culture/zhen-shi-gu-shi.md
```

Expected: 看到 YAML frontmatter 包含 `title`, `slug`, `language: zh`, `category: culture`, `status: todo`, `added_date: 2026-09-09`(今天的日期)

---

## Task 2: 生成英文 4 个 stub 文件

**Files:**
- Create: `podcasts/en/culture/this-american-life.md`
- Create: `podcasts/en/culture/ear-hustle.md`
- Create: `podcasts/en/culture/the-moth.md`
- Create: `podcasts/en/news/reveal.md`

- [ ] **Step 1: 跑 make-stub.py 一次生成 4 个英文 stub**

Run from repo root:
```bash
python3 scripts/make-stub.py en culture \
  --slug=this-american-life "This American Life" \
  --slug=ear-hustle "Ear Hustle" \
  --slug=the-moth "The Moth"

python3 scripts/make-stub.py en news --slug=reveal "Reveal"
```

Expected output (exact):
```
made: podcasts/en/culture/this-american-life.md
made: podcasts/en/culture/ear-hustle.md
made: podcasts/en/culture/the-moth.md

made 3, skipped 0, rejected 0
made: podcasts/en/news/reveal.md

made 1, skipped 0, rejected 0
```

Exit code: `0`

- [ ] **Step 2: 验证 4 个文件存在**

Run:
```bash
ls -la podcasts/en/culture/this-american-life.md podcasts/en/culture/ear-hustle.md podcasts/en/culture/the-moth.md podcasts/en/news/reveal.md
```

Expected: 4 个文件存在

- [ ] **Step 3: 检查 reveal.md 路径正确**

Run:
```bash
ls podcasts/en/news/reveal.md
```

Expected: 文件存在(确认落在 en/news 而非 en/culture)

---

## Task 3: 给 8 个 stub 补 tags

每个 stub 的 frontmatter 当前只有 5 字段,需要在 `added_date`/`updated_date` 之后、`tags: - 待收录` 替换为 3+ 个语义标签。

**Files:**
- Modify: 上述 8 个 stub 文件的 frontmatter `tags` 字段

完整 frontmatter 标签映射表(从 spec 第 4 节):

| 文件 | tags 替换为 |
| --- | --- |
| `zhen-shi-gu-shi.md` | `田野调查`, `行业案例`, `口述史`, `非虚构叙事`, `长访谈` |
| `gu-yu-shi-yan-shi.md` | `田野调查`, `行业案例`, `调查报道`, `驻场式` |
| `zheng-wu.md` | `田野调查`, `行业案例`, `非虚构叙事`, `人物特写` |
| `gq-bao-dao.md` | `田野调查`, `行业案例`, `长访谈`, `人物特写` |
| `this-american-life.md` | `field-research`, `方法论范本`, `narrative-nonfiction`, `scene-tape`, `longform-interview` |
| `ear-hustle.md` | `field-research`, `方法论范本`, `embedded`, `scene-tape`, `oral-history` |
| `the-moth.md` | `field-research`, `行业案例`, `oral-history`, `live-event` |
| `reveal.md` | `field-research`, `方法论范本`, `investigative-reporting`, `longform-interview` |

- [ ] **Step 1: 替换 `zhen-shi-gu-shi.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - 田野调查
  - 行业案例
  - 口述史
  - 非虚构叙事
  - 长访谈
```

- [ ] **Step 2: 替换 `gu-yu-shi-yan-shi.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - 田野调查
  - 行业案例
  - 调查报道
  - 驻场式
```

- [ ] **Step 3: 替换 `zheng-wu.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - 田野调查
  - 行业案例
  - 非虚构叙事
  - 人物特写
```

- [ ] **Step 4: 替换 `gq-bao-dao.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - 田野调查
  - 行业案例
  - 长访谈
  - 人物特写
```

- [ ] **Step 5: 替换 `this-american-life.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - field-research
  - 方法论范本
  - narrative-nonfiction
  - scene-tape
  - longform-interview
```

- [ ] **Step 6: 替换 `ear-hustle.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - field-research
  - 方法论范本
  - embedded
  - scene-tape
  - oral-history
```

- [ ] **Step 7: 替换 `the-moth.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - field-research
  - 行业案例
  - oral-history
  - live-event
```

- [ ] **Step 8: 替换 `reveal.md` 的 tags**

Edit 工具:
- old_string:
```
tags:
  - 待收录
```
- new_string:
```
tags:
  - field-research
  - 方法论范本
  - investigative-reporting
  - longform-interview
```

- [ ] **Step 9: 校验所有 8 个文件的 tags 正确**

Run:
```bash
for f in podcasts/zh/culture/zhen-shi-gu-shi.md \
         podcasts/zh/culture/gu-yu-shi-yan-shi.md \
         podcasts/zh/culture/zheng-wu.md \
         podcasts/zh/culture/gq-bao-dao.md \
         podcasts/en/culture/this-american-life.md \
         podcasts/en/culture/ear-hustle.md \
         podcasts/en/culture/the-moth.md \
         podcasts/en/news/reveal.md; do
  echo "=== $f ==="
  grep -A 6 "^tags:" "$f"
done
```

Expected: 每个文件 tags 至少 3 项,且 `待收录` 不再出现

---

## Task 4: 跑 validate_corpus.py

**Files:** none modified by this task — 脚本只读校验

- [ ] **Step 1: 跑校验脚本**

Run:
```bash
python3 scripts/validate_corpus.py
```

Expected:
- exit code `0`
- 报告说通过 / 没新增错误
- 若失败,优先检查是否有重复 slug 或非法 frontmatter

- [ ] **Step 2: 如果失败,定位问题**

(仅 Step 1 失败时执行)

Run:
```bash
python3 scripts/validate_corpus.py 2>&1 | head -50
```

Expected: 看到具体错误信息(slug 重复 / 日期格式 / 必填字段缺失),针对修

- [ ] **Step 3: 失败兜底 — 跑完所有 stub 的 path 安全校验**

(仅 Step 1 失败时执行)

Run:
```bash
for f in podcasts/zh/culture/zhen-shi-gu-shi.md \
         podcasts/zh/culture/gu-yu-shi-yan-shi.md \
         podcasts/zh/culture/zheng-wu.md \
         podcasts/zh/culture/gq-bao-dao.md \
         podcasts/en/culture/this-american-life.md \
         podcasts/en/culture/ear-hustle.md \
         podcasts/en/culture/the-moth.md \
         podcasts/en/news/reveal.md; do
  python3 -c "
import sys, pathlib
p = pathlib.Path('$f').resolve()
root = pathlib.Path('podcasts').resolve()
if not str(p).startswith(str(root)):
    print(f'PATH ESCAPE: {p}')
    sys.exit(1)
print(f'OK: {p}')
"
done
```

Expected: 8 行 `OK:` 开头,exit code `0`

---

## Task 5: 跑 stats.py 刷新 INDEX.md

**Files:**
- Modify (auto): `podcasts/INDEX.md`
- Modify (auto): `podcasts/README.md`(统计段)

- [ ] **Step 1: 跑统计脚本**

Run:
```bash
python3 scripts/stats.py
```

Expected:
- exit code `0`
- 输出包含 `8 new stubs` 或类似增量提示
- INDEX.md 已更新

- [ ] **Step 2: 校验 INDEX.md 含 8 个新档**

Run:
```bash
grep -E "zhen-shi-gu-shi|gu-yu-shi-yan-shi|zheng-wu|gq-bao-dao|this-american-life|ear-hustle|the-moth|reveal" podcasts/INDEX.md | wc -l
```

Expected: 输出 ≥ 8(每档在表格里至少出现 1 次,部分可能在文件名链接里出现 2 次)

- [ ] **Step 3: 校验 README.md 的统计段已更新**

Run:
```bash
grep -E "总档数|深档|stub" podcasts/README.md | head -20
```

Expected: 看到类似「184 → 192」「+8」或「192 档」的总档数

- [ ] **Step 4: 检查 zh/culture 计数**

Run:
```bash
grep -A 1 "zh/" podcasts/README.md | head -10
```

Expected: zh/culture 行显示档数从 18 → 22(增加 4)

---

## Task 6: 跑 export.py 生成 dist

**Files:**
- Modify (auto): `dist/podcasts.json`
- Modify (auto): `dist/podcasts.csv`

- [ ] **Step 1: 跑 export 脚本**

Run:
```bash
python3 scripts/export.py
```

Expected:
- exit code `0`
- 输出显示 8 个新条目被纳入导出

- [ ] **Step 2: 校验 dist 文件已生成**

Run:
```bash
ls -la dist/podcasts.json dist/podcasts.csv
```

Expected: 两个文件存在,mtime 是刚才

- [ ] **Step 3: 校验 JSON 含 8 个新 slug**

Run:
```bash
python3 -c "
import json
data = json.load(open('dist/podcasts.json'))
new_slugs = {'zhen-shi-gu-shi','gu-yu-shi-yan-shi','zheng-wu','gq-bao-dao','this-american-life','ear-hustle','the-moth','reveal'}
found = {e['slug'] for e in data if e.get('slug') in new_slugs}
missing = new_slugs - found
print(f'found: {len(found)}/8')
print(f'missing: {missing}' if missing else 'all present')
assert not missing, f'missing slugs: {missing}'
print('OK')
"
```

Expected: 输出 `found: 8/8` + `all present` + `OK`

---

## Task 7: git status 过目 + 用户审阅

**Files:** none modified by this task — only `git status` / `git diff --stat`

- [ ] **Step 1: 看 git status**

Run:
```bash
git status --short
```

Expected: 8 个 untracked .md(stub 文件)+ 2-3 个 modified(INDEX.md / README.md / dist/*)。无意外改动。

- [ ] **Step 2: 看 diff 统计**

Run:
```bash
git diff --stat
git status --short | wc -l
```

Expected: 显示 8 new + ~3 modified,total line changes 数百行以内

- [ ] **Step 3: 抽样看 1 个新 stub 的完整内容**

Run:
```bash
cat podcasts/zh/culture/zhen-shi-gu-shi.md
```

Expected: 看到 frontmatter(7 字段含 5 tags)+ 「待收录」正文

- [ ] **Step 4: 让用户审阅**

通过 AskUserQuestion 提供选项:
- 「批准 commit」→ 进入 Task 8
- 「需调整」→ 回到对应任务修改
- 「取消入库」→ `git restore` 所有新文件 + `git checkout` 自动修改

---

## Task 8: 单 commit(用户批准后)

**Files:** 8 个新 stub + INDEX.md / README.md / dist/*(都是自动产物,与新 stub 一起 commit)

- [ ] **Step 1: 暂存所有改动**

Run:
```bash
git add \
  podcasts/zh/culture/zhen-shi-gu-shi.md \
  podcasts/zh/culture/gu-yu-shi-yan-shi.md \
  podcasts/zh/culture/zheng-wu.md \
  podcasts/zh/culture/gq-bao-dao.md \
  podcasts/en/culture/this-american-life.md \
  podcasts/en/culture/ear-hustle.md \
  podcasts/en/culture/the-moth.md \
  podcasts/en/news/reveal.md \
  podcasts/INDEX.md \
  podcasts/README.md \
  dist/podcasts.json \
  dist/podcasts.csv
```

Expected: 无输出(exit code 0)

- [ ] **Step 2: 验证暂存区**

Run:
```bash
git status --short
```

Expected: 12 个文件全部 `A`(added)或 `M`(modified)状态,无 `??`(untracked)残留

- [ ] **Step 3: 单 commit**

Run:
```bash
git commit -m "$(cat <<'EOF'
docs(corpus): 批次 11 — 田野调查播客专项 8 档 stub(中文 4 + 英文 4)

新增 zh/culture 4 档(真实故事/谷雨实验室/正午/GQ 报道)
+ en/culture 3 档(This American Life/Ear Hustle/The Moth)
+ en/news 1 档(Reveal),全为田野调查 / 访谈方法论向 stub。

tags 约定:中文档用「田野调查」,英文档用「field-research」,
按角色标「方法论范本」或「行业案例」,再附 1-3 个风格标签。

本轮不触动现有 184 档;升级候选(岩中花述/言外之易/涟漪效应)
留作批次 12。
EOF
)"
```

Expected: 1 commit created,commit hash 形如 `a1b2c3d`

- [ ] **Step 4: 最终验证**

Run:
```bash
git log --oneline -1
git show --stat HEAD | head -20
```

Expected: HEAD commit 显示「docs(corpus): 批次 11」+ 12 files changed

---

## Self-Review

**1. Spec 覆盖检查**

- §3.1 中文 4 档 → Task 1 ✓
- §3.2 英文 4 档 → Task 2 ✓
- §4 tags 约定 → Task 3 (8 个 step 一一对应)✓
- §5 工作流(generate / tag / validate / stats / export / review / commit)→ Task 1-8 完整对应 ✓
- §6 不动的东西 → 全 plan 没有任何对 schema/_template/README/脚本的修改 ✓
- §7 风险与回滚 → Task 4 Step 2-3 失败兜底;Task 7 Step 4 用户可取消 ✓
- §9 验收标准 → Task 4 (validate 退出 0) + Task 5 (stats) + Task 6 (export) + Task 7 (review) + Task 8 (commit) ✓

**2. 占位扫描**

- 全文搜 `TBD` / `TODO` / `implement later` / `similar to` → 无
- 所有 frontmatter 字段、命令、路径都是确定值 ✓

**3. 类型一致性**

- slug 命名在 Task 1/2(make-stub)和 Task 3(tags)、Task 6(export 校验)、Task 8(commit add)完全一致 ✓
- tag 列表在 Task 3 表格与 Step 1-8 完全一致 ✓
- 8 个文件路径在所有 Task 中保持一致 ✓

---

## Execution Handoff

执行方式二选一:

1. **Subagent-Driven (推荐)** — 每个 Task 派一个新 subagent,Task 间评审,迭代快
2. **Inline Execution** — 当前会话直接顺序跑,Task 5/6 后设检查点
