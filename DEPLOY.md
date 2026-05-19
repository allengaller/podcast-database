# LeetCast 部署指南

## 架构概览

- **Web**: Next.js 14 (Vercel) — 目录: `frontend/`
- **Worker**: Docker 容器 (Railway / Render / Fly.io)
- **Database**: PostgreSQL (Railway / Supabase / Render)
- **Cache/Queue**: Redis (Upstash / Railway)
- **Storage**: S3 兼容对象存储 (MinIO / 阿里云 OSS / AWS S3)

---

## 1. 环境变量

复制 `.env.example` 到各应用目录并填入真实值：

```bash
cp .env.example apps/web/.env
cp .env.example apps/worker/.env
```

必填变量：
- `DATABASE_URL` - PostgreSQL 连接字符串
- `REDIS_URL` - Redis 连接字符串
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` - 对象存储
- `OPENAI_API_KEY`, `ELEVENLABS_API_KEY` - AI / TTS
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `AUTH_SECRET` - NextAuth
- `ADMIN_TOKEN` - Admin API 鉴权

---

## 2. 数据库初始化

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client
pnpm db:generate

# 推送 Schema
pnpm db:push

# 填充 LeetCode 题库
pnpm --filter database db:seed
```

---

## 3. Web 部署 (Vercel)

1. 在 Vercel 导入 GitHub 仓库
2. Root Directory 设为 `frontend`
3. Build Command: `cd .. && pnpm install && pnpm --filter @leetcast/core build && pnpm --filter @leetcast/database build && cd frontend && next build`
4. 添加所有环境变量
5. 可选：配置 Vercel Cron Job 触发每日选题

---

## 4. Worker 部署

Worker 是长期运行的 Node.js 进程，负责消费 BullMQ 队列生成播客。

### Docker 构建

```bash
docker build -f apps/worker/Dockerfile -t leetcast-worker .
docker run -e DATABASE_URL=... -e REDIS_URL=... leetcast-worker
```

### Railway / Render

直接选择 Dockerfile 部署，指定 `apps/worker/Dockerfile` 路径。

---

## 5. 发布每日一题

访问 Admin 后台：
```
https://your-domain.com/admin
```

输入 Admin Token，选择选题策略，点击"发布今日一题"。Worker 会在后台自动生成播客并上传存储。

---

## 6. 本地开发快速启动

```bash
# 1. 启动基础设施
docker compose up -d

# 2. 初始化 MinIO bucket
node scripts/setup-minio.js

# 3. 安装依赖
pnpm install

# 4. 构建共享包
pnpm --filter @leetcast/core build
pnpm --filter @leetcast/database build

# 5. 推送数据库并填充题目
pnpm db:push
pnpm --filter database db:seed

# 6. 启动 Worker
pnpm --filter @leetcast/worker dev

# 7. 启动 Web (新终端)
pnpm --filter @leetcast/web dev
```

访问 http://localhost:3000 即可使用。
