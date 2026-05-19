# LeetCast 修复报告

日期: 2026-05-18
基于: EVALUATION.md 评估报告

---

## 修复汇总 (14 项)

### 架构 (3 项)

| 文件 | 修改内容 |
|------|----------|
| `pnpm-workspace.yaml` | 纳入 `frontend/` 作为 workspace 成员 |
| `README.md` | 更新项目架构树，`apps/web` -> `frontend/` |
| `DEPLOY.md` | Vercel 部署路径指向 `frontend/`，构建命令适配 monorepo |
| `.eslintrc.json` | `ignorePatterns` 从 `"*.js"` 改为仅忽略 `*.config.js` / `*.config.mjs` |

### CI/CD (2 项)

| 文件 | 修改内容 |
|------|----------|
| `.github/workflows/ci.yml` | `npm ci` -> `pnpm install --frozen-lockfile`，添加 `pnpm/action-setup@v4`，共享包预构建 |
| `apps/worker/Dockerfile` | `npm ci` -> `pnpm`，多阶段构建适配 monorepo 结构（先装后拷） |

### 安全 (5 项)

| 文件 | 修改内容 |
|------|----------|
| `.eslintrc.json` | ESLint 类型安全规则全部 `warn` -> `error`（no-explicit-any, no-unsafe-*, no-floating-promises 等 10 条） |
| `docker-compose.yml` | PostgreSQL / MinIO 硬编码密码 -> 环境变量 `${VAR:?提示}`（启动时强制要求设置） |
| `SECURITY.md` | `security@example.com` -> `leetcast-security@users.noreply.github.com` |
| `src/services/audio.ts` | 新增 `sanitizeFilename()` 防路径遍历；新增 resolved path 校验确保文件在 DOWNLOAD_DIR 内 |
| `frontend/src/app/api/admin/daily/route.ts` | 添加 zod schema 验证（strategy/userId/problemId）；JSON 解析错误处理 |
| `frontend/src/app/api/progress/route.ts` | 添加 zod schema 验证（podcastId/progress/completed） |

### 代码质量 (5 项)

| 文件 | 修改内容 |
|------|----------|
| `packages/database/src/seed.ts` | `t: any` -> `t: { name: string }`，消除 ESLint no-explicit-any |
| `src/utils/retry-utils.ts` | `lastError: any` -> `lastError: unknown` |
| `src/services/audio.ts` | `(error as any).killed` -> `(error as { killed?: boolean }).killed` |
| `src/services/mcp.ts` | 提取 `writeAudioStream()` 独立方法，简化 ElevenLabs 返回值三重判断逻辑 |
| `CONTRIBUTING.md` | 所有 `npm` 命令 -> `pnpm`；目录结构与实际一致；环境变量路径修正 |

### 性能 (2 项)

| 文件 | 修改内容 |
|------|----------|
| `frontend/src/components/player.tsx` | 整组件 `memo` 包裹；波形条 `WaveFormBar` 独立 memo 组件；波形高度预计算（`WAVEFORM_HEIGHTS` 常量）避免重渲染随机变化 |
| `frontend/src/components/player.tsx` | 进度保存间隔从 5s 改为 10s 防抖；`progressRef` 避免闭包陈旧值 |

### 测试 (3 个新文件)

| 文件 | 覆盖内容 |
|------|----------|
| `src/__tests__/mcp.test.ts` | MCPService：mock 播客生成（无 API key）、real 播客生成（mock OpenAI/ElevenLabs）、结果元数据校验 |
| `src/__tests__/retry-utils.test.ts` | 增强：指数退避时间验证、错误类型透传、sleep 函数独立测试 |
| `packages/database/src/__tests__/strategy.test.ts` | StrategyEngine 全覆盖：progressive（Easy/Medium/Hard 阈值）、classic、weakspot（有/无弱项、匿名用户）、null 场景 |

### 文档 (1 项)

| 文件 | 说明 |
|------|------|
| `EVALUATION.md` | 项目评估报告（七维度评分 + 问题清单） |

---

## 变更统计

- 修改文件: 16 个
- 新增文件: 4 个 (3 个测试 + 1 个评估报告)
- 涉及维度: 架构、CI/CD、安全、代码质量、性能、测试、文档

---

## 未处理项（需手动操作）

1. **" 2" 副本文件清理** — 根目录约 30 个带 " 2" 后缀的重复文件/目录（如 `apps 2/`, `README 2.md`），未被 git 跟踪，建议手动删除：
   ```bash
   find . -maxdepth 1 -name "*2*" -not -name ".git*" | xargs rm -rf
   ```
2. **安装 zod 依赖** — `frontend/package.json` 已添加 zod，需运行 `pnpm install`
3. **根 tsconfig.json** — 当前 linter 使用的 tsconfig 缺少 `@types/node` 等类型声明，建议各子包独立运行 lint 而非根级 lint
