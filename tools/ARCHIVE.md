# Archived: LeetCast

> ⚠️ **本目录是 LeetCast 历史代码归档,不再维护,不再构建。**
>
> 归档日期:2026-08-03 · 归档自仓库根目录 · 通过 `git mv` 整树移动,保留完整提交历史。

---

## 这是什么

**LeetCast** 是一个面向程序员的「每日一题播客」平台:AI 生成 LeetCode 解题对话脚本 → ElevenLabs 多角色 TTS → FFmpeg 混音 → 用户每日收听打卡。本目录是该项目从仓库根目录归档而来的完整工程树。

本仓库已转型为**全网热点播客深度研究语料库**(见仓库根 `README.md` 与 `podcasts/`),LeetCast 代码作为「语料库可能用到的辅助工具」保留于此,供查阅与偶发取用。

## 目录构成

整树移动后目录结构与原仓库根一致,故 `apps/worker/tsconfig.json` 中的相对路径(`../../packages/...`)在 `tools/` 内部仍然成立——理论上可独立构建。**但本项目不再保证构建可用**,如需运行请参考下方「如需复活」。

| 路径 | 说明 |
| --- | --- |
| `apps/cli` | CLI 工具 + MCP Server(含 `transcribe` 外部播客转写命令) |
| `apps/worker` | BullMQ Worker(播客生成 + 健康检查) |
| `frontend` | Next.js 14 Web App(App Router) |
| `packages/core` | 共享逻辑(LeetCode API、TTS、FFmpeg 混音、Storage) |
| `packages/database` | Prisma Schema + 选题策略 + Seed |
| `package.json` / `turbo.json` / `pnpm-workspace.yaml` | monorepo 根配置 |
| `tsconfig.json` / `.eslintrc.json` / `.prettierrc` 等 | 工具链配置 |
| `Dockerfile` / `docker-compose.yml` / `railway.toml` | 部署配置 |
| `.github/workflows/` | CI / Release / 每日 cron(GH Actions 不读子目录,此处仅存档) |
| `.husky/` | Git hooks(`pre-commit` 跑 lint、`pre-push` 跑 typecheck) |
| `README.md` / `QUICKSTART.md` / `DEPLOY.md` / `ENGINEERING.md` 等 | 原 LeetCast 文档全套 |

## 归档时一并清理的内容

- `.turbo/cache/` —— 移除 30 个误提交的构建缓存文件(`.gitignore` 已含 `.turbo`,本次让忽略规则生效)。
- 5 个 macOS 风格重复文件(`rate-limit.test 2.ts`、`sentry.test 2.ts`、`setup 2.ts`、`utils.test 2.ts`、`vitest.config 2.ts`)。

## 如需复活

```bash
cd tools
pnpm install
cp .env.example frontend/.env.local   # 填入 API Keys
cp .env.example apps/worker/.env
docker compose up -d                  # PostgreSQL + Redis + MinIO
pnpm --filter @leetcast/core build
pnpm --filter @leetcast/database build
pnpm db:push
pnpm dev
```

详见 `tools/QUICKSTART.md`。**注意**:复活后该子目录的 `.github/workflows/` 不会自动生效(GH Actions 只读仓库根),需要时请移回根 `.github/`。

## 与语料库的关系

本目录的 `apps/cli` 中的 `transcribe` 命令(把任意 Apple Podcasts / RSS 音频经阿里云通义听悟转写为本地 Markdown)是语料库未来可能用到的工具之一。但语料库本身以**人工 / 半自动整理的 Markdown 为主**,不依赖本目录代码运行。
