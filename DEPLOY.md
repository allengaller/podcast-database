# LeetCast 部署指南

## 架构概览

| 组件           | 部署目标                    | 说明                                                            |
| -------------- | --------------------------- | --------------------------------------------------------------- |
| **Web**        | Vercel（推荐）              | Next.js 14 SSR/SSG 边沿函数；读 Prisma、Redis、生成 BullMQ 任务 |
| **Worker**     | Railway / Render / Fly.io   | 长驻 Node.js 进程；消费 BullMQ 队列生成 + 上传播客              |
| **PostgreSQL** | Supabase / Neon / Railway   | 16+，Prisma 6                                                   |
| **Redis**      | Upstash / Railway           | BullMQ 队列 + 速率限制                                          |
| **对象存储**   | 阿里云 OSS / AWS S3 / MinIO | 播客 MP3 长期存放                                               |
| **定时任务**   | GitHub Actions cron         | 每天触发 `/api/admin/daily`（无需另起服务）                     |

---

## 1. 30 分钟跑通（先跑通，再谈生产）

> 目标：本地能完整跑一次「听播客 + 打卡」。

### 1.1 准备

- Node.js 22+（用 `nvm` 或 `fnm`）
- pnpm 10（`npm i -g pnpm`）
- Docker Desktop
- yt-dlp（可选，外部播客转写才需要）

### 1.2 一键脚本

```bash
# 克隆
git clone https://github.com/your-username/leetcast.git
cd leetcast

# 依赖 + Prisma
pnpm install
pnpm --filter @leetcast/database exec prisma generate

# 启动基础设施（Postgres + Redis + MinIO）
docker compose up -d

# 数据库 + 题库
pnpm --filter @leetcast/database db:push
pnpm --filter @leetcast/database db:seed

# 终端 A：Worker
pnpm --filter @leetcast/worker dev

# 终端 B：Web
pnpm --filter @leetcast/web dev
```

打开 http://localhost:3000 即可。Admin 后台：http://localhost:3000/admin

### 1.3 Mock 模式（无 API key 也能跑）

如果不配置 `OPENAI_API_KEY` / `ELEVENLABS_API_KEY`，`MCPService` 会回退到 mock 播客：

- 5 秒静音 MP3
- 文字稿是真实 LLM 输出（mock 那部分不带真实音频）
- 数据库、登录、签到全功能可用

这能让你先把部署链跑通，再补 API key。

---

## 2. 环境变量清单

复制 `.env.example` 到对应目录后填值。**必填**没填就启动会崩。

| 变量                       | 必填 | 用途                              | 给谁               |
| -------------------------- | ---- | --------------------------------- | ------------------ |
| `DATABASE_URL`             | ✅   | PostgreSQL                        | Web, Worker        |
| `REDIS_URL`                | ✅   | BullMQ + rate limit               | Web, Worker        |
| `S3_ENDPOINT`              | ✅   | MinIO/S3 endpoint                 | Web, Worker        |
| `S3_BUCKET`                | ✅   | bucket 名                         | Web, Worker        |
| `S3_ACCESS_KEY`            | ✅   | access key                        | Web, Worker        |
| `S3_SECRET_KEY`            | ✅   | secret key                        | Web, Worker        |
| `S3_PUBLIC_URL`            |      | 公网可达的 URL（前端 <audio> 用） | Web                |
| `S3_REGION`                |      | 默认 `us-east-1`                  | Web, Worker        |
| `AUTH_SECRET`              | ✅   | NextAuth 加密                     | Web                |
| `GITHUB_CLIENT_ID`         | ✅   | OAuth App ID                      | Web                |
| `GITHUB_CLIENT_SECRET`     | ✅   | OAuth App secret                  | Web                |
| `ADMIN_TOKEN`              | ✅   | 每日发布鉴权                      | Web（admin route） |
| `CORS_ORIGIN`              |      | 默认 `*`，生产建议限制            | Web                |
| `OPENAI_API_KEY`           |      | LLM（缺则 mock）                  | Worker             |
| `OPENAI_BASE_URL`          |      | 百炼兼容模式                      | Worker             |
| `OPENAI_MODEL`             |      | 默认 `gpt-4o`                     | Worker             |
| `ELEVENLABS_API_KEY`       |      | TTS（缺则 mock）                  | Worker             |
| `HOST_VOICE_ID`            |      | ElevenLabs 音色                   | Worker             |
| `ENGINEER_VOICE_ID`        |      | ElevenLabs 音色                   | Worker             |
| `ALIYUN_ACCESS_KEY_ID`     |      | 通义听悟（外部播客转写）          | CLI                |
| `ALIYUN_ACCESS_KEY_SECRET` |      | 通义听悟                          | CLI                |
| `TINGWU_APP_KEY`           |      | 通义听悟 AppKey                   | CLI                |
| `SENTRY_DSN`               |      | 服务端错误上报（Worker）          | Worker             |
| `NEXT_PUBLIC_SENTRY_DSN`   |      | 浏览器错误上报                    | Web                |
| `SENTRY_AUTH_TOKEN`        |      | Source map 上传（CI）             | CI                 |
| `SENTRY_ORG`               |      | Sentry 组织                       | CI                 |
| `SENTRY_PROJECT`           |      | Sentry 项目                       | CI                 |

### GitHub Actions 专属

| 变量 / Secret      | 类型     | 用途                                                  |
| ------------------ | -------- | ----------------------------------------------------- |
| `LEETCAST_WEB_URL` | Variable | 已部署 Web 的 URL（如 `https://leetcast.vercel.app`） |
| `ADMIN_TOKEN`      | Secret   | 跟 Web 用同一个 Admin Token                           |

---

## 3. Vercel 部署 Web

### 3.1 通过 Vercel Dashboard

1. 仓库导入 Vercel
2. Project Settings → Build & Development Settings：
   - **Root Directory**：`frontend`
   - **Build Command**：`cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @leetcast/core build && pnpm --filter @leetcast/database build && cd frontend && pnpm build`
   - **Install Command**：`cd ../.. && pnpm install --frozen-lockfile`
   - **Output Directory**：`.next`
   - **Framework Preset**：Next.js
3. Environment Variables：粘贴上面的「必填」+ 你需要的可选项
4. Deploy

### 3.2 通过 `vercel.json`（已配置）

仓库里 `frontend/vercel.json` 已经写好：

```json
{
  "buildCommand": "cd ../.. && pnpm install && pnpm --filter @leetcast/web build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "pnpm install"
}
```

注意：Vercel 的 `buildCommand` 默认在 `frontend/` 里执行，所以 `cd ../..` 是回到 monorepo 根再装依赖 + 构建。如果共享包用 `transpilePackages`（见 `next.config.mjs`），这样够用。

### 3.3 Vercel 边沿函数注意

- Prisma 在 Vercel Edge Runtime **不**支持（需要 Node.js Runtime）。我们所有 RSC 都用 `runtime: 'nodejs'`（默认）。
- Redis 通过 `ioredis`，需要在 Node.js Runtime 跑。
- 看 `frontend/src/app/api/health/route.ts` 里的 `export const dynamic = 'force-dynamic'`：确保 RSC 不被缓存。

### 3.4 Cron 替代方案：GitHub Actions

Vercel Cron 需要 Pro 计划。用 GitHub Actions（已经配好 `.github/workflows/daily-podcast-cron.yml`）免费跑：

1. 在仓库 Settings → Secrets and variables → Actions：
   - `ADMIN_TOKEN`（secret）
   - `LEETCAST_WEB_URL`（variable，例如 `https://leetcast.vercel.app`）
2. 触发方式：
   - 自动：每天 UTC 00:05（北京时间 08:05）
   - 手动：Actions → Daily Podcast Cron → Run workflow

---

## 4. Worker 部署

Worker 是长驻 Node 进程，Vercel **不**适合。用 Docker 部署到 Railway / Render / Fly.io 都可以。

### 4.1 Dockerfile

仓库根目录的 `apps/worker/Dockerfile` 已经多阶段构建好，pnpm + Node 22 alpine。

### 4.2 Railway 快速部署

```bash
# 安装 railway CLI
brew install railway

# 登录并初始化
railway login
railway init

# 设置环境变量（直接复制 .env 文件）
railway variables set DATABASE_URL=... REDIS_URL=...

# 部署（自动读 apps/worker/Dockerfile）
railway up --dockerfile apps/worker/Dockerfile
```

### 4.3 健康检查

Worker 监听 `:3001/health`，返回：

```json
{
  "status": "healthy" | "degraded",
  "checks": { "worker": "ok", "redis": "ok" | "error" }
}
```

在 Railway / Render 里把 Healthcheck Path 配成 `/health`。

---

## 5. 数据库初始化（生产）

```bash
# 第一次部署时，在本地连远端 DB
DATABASE_URL=postgresql://... pnpm --filter @leetcast/database db:push
DATABASE_URL=postgresql://... pnpm --filter @leetcast/database db:seed
```

生产环境**不要**用 `db:push`（会丢数据），用 `db:migrate`：

```bash
pnpm --filter @leetcast/database db:migrate
```

---

## 6. 故障排查

### 6.1 Vercel 构建失败：`Cannot find module '@leetcast/core'`

`frontend/next.config.mjs` 已经 `transpilePackages: ['@leetcast/core', '@leetcast/database']`，但前提是这些包先 build 出 `dist/`。`buildCommand` 必须先 build core/database：

```
cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @leetcast/core build && pnpm --filter @leetcast/database build && cd frontend && pnpm build
```

### 6.2 Web 报 500：`PrismaClientInitializationError`

`DATABASE_URL` 配错或 Postgres 不可达。检查 Vercel 的环境变量 + 数据库白名单（很多 PaaS 默认拒绝所有外部 IP）。

### 6.3 Worker 卡在「RUNNING」

单集超过 4 小时，通义听悟会很慢。`ffmpeg -i in.m4a -c copy -segment_time 7200 chunk_%02d.m4a` 切分后逐个提交。

### 6.4 播客文件 403

`S3_BUCKET` 桶不是公开读。前端用 `<audio>` 直接拉 URL，公网必须可访问；或前置 CDN 公开。

---

## 7. 升级流程

```bash
# 拉最新
git pull

# 装新依赖
pnpm install

# 数据库变更
pnpm --filter @leetcast/database db:push   # 开发
# 或
pnpm --filter @leetcast/database db:migrate --name <change>  # 生产

# 重启 Worker
railway restart   # 或你的平台对应命令

# Vercel 自动部署
git push
```

---

## 8. 监控与告警（生产推荐）

- **Sentry**：Web + Worker 错误上报，配置 `SENTRY_DSN`
- **Uptime**：UptimeRobot / BetterStack 监控 `https://your-domain.com/api/health`
- **日志**：Vercel 内置 + Worker 走 platform（Railway Logs / Render Logs）
- **指标**：Vercel Analytics（前端）+ 自己接 Prometheus（Worker）

---

## 9. 备份

- **Postgres**：自动备份（Supabase 7 天，Railway 7 天）。手动：`pg_dump` 每天 cron。
- **S3 桶**：开 versioning，万一删错能恢复。
- **Redis**：BullMQ 任务失败不丢；重要状态都在 Postgres。

---

## 10. 成本估算（月）

| 资源                | 最低           | 推荐      | 备注              |
| ------------------- | -------------- | --------- | ----------------- |
| Vercel (Hobby)      | $0             | $20 (Pro) | Hobby 限 cron     |
| Railway (Worker)    | $5             | $10-20    | 512MB-1GB 够用    |
| Supabase (Postgres) | $0 (free tier) | $25 (Pro) | 500MB 内免费      |
| Upstash (Redis)     | $0 (free tier) | $10       | 10K cmd/day 免费  |
| S3 兼容存储         | ~$1            | $5        | 100MB-1GB         |
| OpenAI              | ~$5            | $20       | 100 集/月         |
| ElevenLabs          | ~$5            | $22       | Creator 套餐      |
| Sentry              | $0 (free)      | $26       | 5K events/月 免费 |
| **合计**            | **~$16**       | **~$140** |                   |

---

参考：[README.md](./README.md) · [CONTRIBUTING.md](./CONTRIBUTING.md) · [SECURITY.md](./SECURITY.md)
