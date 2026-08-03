# 30 分钟跑通 LeetCast

> 目标：从 clone 到浏览器看到首页 + 触发一次 Admin 发布。

## 0. 前置

- Node.js 22+ ([下载](https://nodejs.org))
- pnpm 10：`npm i -g pnpm`
- Docker Desktop（启动用）

无需 API key：缺 `OPENAI_API_KEY` / `ELEVENLABS_API_KEY` 自动走 mock。

## 1. 装依赖（2 分钟）

```bash
git clone https://github.com/your-username/leetcast.git
cd leetcast
pnpm install
pnpm --filter @leetcast/database exec prisma generate
```

## 2. 起基础设施（1 分钟）

```bash
docker compose up -d
# postgres :5432, redis :6379, minio :9000/:9001
```

`docker compose` 会从 `.env` 拉变量（[VALUES REQUIRED] 占位的需要先填）。先复制模板：

```bash
cp .env.example .env
# 编辑 .env：填入 ADMIN_TOKEN、 AUTH_SECRET、 GITHUB_CLIENT_ID/SECRET
# 其他可以先留着默认值
```

## 3. 初始化数据库（1 分钟）

```bash
pnpm --filter @leetcast/database db:push        # 推送 Prisma schema
pnpm --filter @leetcast/database db:seed        # 拉 LeetCode Top 100
```

## 4. 起服务（两个终端）

```bash
# 终端 A
pnpm --filter @leetcast/worker dev
# → LeetCast worker started, health check on :3001/health

# 终端 B
pnpm --filter @leetcast/web dev
# → ready on http://localhost:3000
```

## 5. 验证

打开浏览器：

- ✅ http://localhost:3000 — 首页（今日播客占位）
- ✅ http://localhost:3000/problems — 题单浏览
- ✅ http://localhost:3000/login — GitHub 登录（OAuth 需要先在 GitHub 配 callback）
- ✅ http://localhost:3000/admin — Admin 后台（输入 `ADMIN_TOKEN` 验证）
- ✅ http://localhost:3001/health — Worker 健康检查

## 6. 触发一次播客生成

用 curl：

```bash
curl -X POST http://localhost:3000/api/admin/daily \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"strategy":"progressive"}'
# → {"jobId":"1","problemId":"1"}
```

或者浏览器进 `/admin` 点按钮。

Worker 会在 5-30 秒内（mock）或 1-3 分钟（真实 LLM）生成完播客，刷新首页可见。

## 7. 跑测试

```bash
pnpm typecheck       # 5/5 包通过
pnpm test            # 11 suites / 85+ cases
pnpm --filter @leetcast/web test:e2e   # Playwright smoke
```

## 卡住了？

- **`Cannot find module '@leetcast/core'`** → `pnpm --filter @leetcast/core build && pnpm --filter @leetcast/database build`
- **Postgres 连不上** → `docker compose ps` 看容器是否起，`pg_isready`（如有）测试
- **MinIO 报默认凭证** → 检查 `.env` 里 `S3_ACCESS_KEY` / `S3_SECRET_KEY`（不能留空）
- **Worker 一直在 retry** → 看 `worker.log`（如果配了）+ Sentry 错误（如果配了 DSN）

详见 [DEPLOY.md](./DEPLOY.md) 生产部署章节。
