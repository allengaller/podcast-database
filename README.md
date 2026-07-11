# LeetCast

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**LeetCast** 是一个面向程序员的每日一题播客平台。每天登录，听一集 LeetCode 解题讲解播客，利用碎片时间提升算法能力。

---

## 核心特性

- **每日一题播客** -- AI 生成多角色对话式讲解，配合背景音乐与片头片尾
- **AI 深度解析** -- OpenAI GPT-4o 生成思路、代码 walkthrough、复杂度分析
- **多角色语音合成** -- ElevenLabs 双人对谈（主持人 + 资深工程师）
- **海量题库** -- LeetCode Top 100 实时同步，支持标签/难度筛选
- **学习追踪** -- 播放进度自动保存、连续打卡、排行榜、分享海报
- **Admin 后台** -- 三种选题策略（难度渐进 / 经典题单 / 弱项强化）
- **外部播客逐字稿** -- CLI 一键把任意 Apple Podcasts / RSS 链接转写为带时间戳、说话人分离的本地 Markdown
- **生产就绪** -- 健康检查、Rate Limiting、CSP 安全头、指数退避重试

---

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 9
- Docker & Docker Compose
- FFmpeg

### 安装与启动

```bash
# 1. 克隆并进入项目
git clone https://github.com/your-username/leetcast.git
cd leetcast

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example frontend/.env.local
cp .env.example apps/worker/.env
# 编辑 .env 填入 API Keys（见下方环境变量说明）

# 4. 启动基础设施（PostgreSQL + Redis + MinIO）
docker compose up -d

# 5. 构建共享包
pnpm --filter @leetcast/core build
pnpm --filter @leetcast/database build

# 6. 初始化数据库并填充题库
pnpm db:push
pnpm --filter @leetcast/database db:seed

# 7. 启动 Worker（终端 A）
pnpm --filter @leetcast/worker dev

# 8. 启动 Web（终端 B）
pnpm --filter @leetcast/frontend dev
```

访问 http://localhost:3000 | Admin 后台: http://localhost:3000/admin | 健康检查: http://localhost:3000/api/health

### 接入阿里云百炼（可选）

若不想使用 OpenAI，可接入阿里云百炼的兼容模式。在 `apps/worker/.env` 中配置：

```env
OPENAI_API_KEY=sk-你的百炼Key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-max
```

未配置 ElevenLabs 时，系统 fallback 为 5 秒 mock 音频，但文字稿为真实 LLM 内容。

---

## 项目架构

```
leetcast/
├── apps/
│   ├── cli/                  # CLI 工具 + MCP Server（含 `transcribe` 外部播客转写命令）
│   └── worker/               # BullMQ Worker（播客生成 + 健康检查）
├── frontend/                 # Next.js 14 Web App (App Router)
│   └── src/
│       ├── app/              # 页面路由 + API 路由
│       ├── components/       # UI 组件 (shadcn/ui) + Player + ErrorBoundary
│       ├── lib/              # 工具库 (rate-limit)
│       └── auth.ts           # NextAuth v5 配置
├── packages/
│   ├── core/                 # 共享逻辑（LeetCode API、TTS、FFmpeg 混音、Storage）
│   └── database/             # Prisma Schema + 选题策略 + Seed
├── docker-compose.yml        # PostgreSQL + Redis + MinIO
├── data/                     # `transcribe` 命令产出的 Markdown 逐字稿
├── downloads/                # yt-dlp 缓存的原始音频
├── .github/workflows/        # CI (build/test/lint) + Release (pnpm publish)
└── .env.example              # 环境变量模板
```

### 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 (App Router, RSC) + Tailwind CSS + shadcn/ui |
| 认证 | NextAuth v5 (GitHub OAuth, Prisma Adapter) |
| 任务队列 | BullMQ + Redis |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 对象存储 | MinIO / S3 兼容 |
| AI/LLM | OpenAI GPT-4o（兼容阿里云百炼 DashScope） |
| TTS | ElevenLabs (eleven_multilingual_v2) |
| 音频处理 | FFmpeg (混音、BGM、片头片尾) |
| 工程化 | pnpm workspace + Turborepo + ESLint + Prettier |
| CI/CD | GitHub Actions + Docker |

---

## 页面路由

| 路由 | 类型 | 说明 |
|---|---|---|
| `/` | Server Component | 首页 -- 今日播客 + 自定义播放器 + 用户统计 |
| `/problems` | Server Component | 题单浏览 + 搜索 + 难度/标签筛选 |
| `/leaderboard` | Server Component | 排行榜（连续打卡 Top 20） |
| `/profile` | Server Component | 个人中心（打卡日历、学习统计） |
| `/admin` | Client Component | Admin 后台（选题策略 + 发布） |
| `/login` | Server Component | GitHub OAuth 登录 |

## API 路由

| 路由 | 方法 | 认证 | 说明 |
|---|---|---|---|
| `/api/daily` | GET | Public | 获取今日播客 |
| `/api/problems` | GET | Public | 题目列表（分页 + 搜索） |
| `/api/progress` | POST | User | 保存播放进度 + 触发打卡 |
| `/api/share` | GET | User | 生成分享海报 SVG |
| `/api/admin/daily` | POST | Admin Token | 触发每日播客生成（BullMQ） |
| `/api/health` | GET | Public | 健康检查（DB + Redis 连通性） |
| `/api/auth/[...nextauth]` | GET/POST | -- | NextAuth 认证 |

---

## 环境变量

完整模板见 `.env.example`。关键变量：

| 变量 | 用途 | 必填 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | 是 |
| `REDIS_URL` | Redis 连接串 | 是 |
| `S3_ENDPOINT` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET` | MinIO / S3 存储 | 是 |
| `OPENAI_API_KEY` | LLM 脚本生成 | 否（Mock 模式） |
| `OPENAI_BASE_URL` | 自定义 LLM 端点（百炼） | 否 |
| `OPENAI_MODEL` | 模型名称（默认 gpt-4o） | 否 |
| `ELEVENLABS_API_KEY` | TTS 语音合成 | 否（Mock 模式） |
| `HOST_VOICE_ID` / `ENGINEER_VOICE_ID` | ElevenLabs 音色 ID | 否 |
| `AUTH_SECRET` | NextAuth 密钥 | 是 |
| `GITHUB_ID` / `GITHUB_SECRET` | GitHub OAuth | 是 |
| `ADMIN_TOKEN` | Admin API 认证令牌 | 是 |
| `CORS_ORIGIN` | CORS 允许的来源 | 否（默认 `*`） |
| `ALIYUN_ACCESS_KEY_ID` / `ALIYUN_ACCESS_KEY_SECRET` | 通义听悟 AccessKey（外部播客转写） | 否 |
| `TINGWU_APP_KEY` | 通义听悟 AppKey（外部播客转写） | 否 |
| `S3_PUBLIC_URL` | MinIO/S3 公网访问入口（通义听悟拉取音频用） | 否 |

---

## 测试

```bash
# 运行所有测试
pnpm test

# 单独运行各包测试
pnpm --filter @leetcast/cli test
pnpm --filter @leetcast/core test
pnpm --filter @leetcast/worker test
pnpm --filter @leetcast/database test
```

### 测试覆盖

| 模块 | 测试文件 | 覆盖范围 |
|---|---|---|
| LeetCode API | `apps/cli/src/__tests__/leetcode.test.ts` | CRUD 查询 |
| 缓存管理 | `apps/cli/src/__tests__/cache-manager.test.ts` | 加载/保存 |
| 重试工具 | `apps/cli/src/__tests__/retry-utils.test.ts` | 指数退避 |
| MCP 服务 | `apps/cli/src/__tests__/mcp.test.ts` | Mock/Real 播客生成 |
| PodcastEngine | `packages/core/src/__tests__/podcast-engine.test.ts` | 脚本解析、章节标记、Mock 模式 |
| HTML 工具 | `packages/core/src/__tests__/html-utils.test.ts` | 标签剥离、实体解码 |
| 逐字稿格式化 | `packages/core/src/__tests__/transcript-formatter.test.ts` | 通义听悟结果 → Markdown 渲染 |
| 选题策略 | `packages/database/src/__tests__/strategy.test.ts` | 四种策略全覆盖 |
| Worker Job | `apps/worker/src/__tests__/generate-podcast.test.ts` | 任务处理、Daily 逻辑、错误处理 |

---

## 安全与可靠性

### 安全措施

- **Admin 认证**: `crypto.timingSafeEqual` 常量时间比较，防时序攻击
- **输入验证**: 所有 API 路由使用 Zod schema 校验
- **Rate Limiting**: Admin 5 次/分钟，Progress 30 次/分钟
- **安全头**: CSP、X-Frame-Options (DENY)、X-Content-Type-Options (nosniff)、Referrer-Policy
- **CORS**: 可配置 `CORS_ORIGIN`，默认宽松，生产环境建议限制
- **Docker 密码**: docker-compose 使用 `${VAR:?}` 强制环境变量注入

### 可靠性

- **Worker 重试**: BullMQ 3 次指数退避（30s → 60s → 120s）
- **健康检查**: Web `/api/health`（检测 DB + Redis）; Worker `:3001/health`
- **优雅关闭**: Worker 监听 SIGTERM/SIGINT，排空任务后退出
- **错误边界**: React ErrorBoundary + Next.js `error.tsx` 全局错误页
- **结构化日志**: Worker 输出 JSON 格式日志（含 jobId、attempt、errorName）

---

## 开发命令

```bash
pnpm dev              # 启动所有包开发模式 (Turborepo)
pnpm build            # 构建所有包
pnpm lint             # ESLint 检查
pnpm typecheck        # TypeScript 类型检查
pnpm test             # 运行所有测试
pnpm format           # Prettier 格式化
pnpm db:push          # 推送 Prisma Schema 到数据库
pnpm db:studio        # 打开 Prisma Studio
```

---

## 外部播客 → 本地 Markdown 逐字稿

CLI 提供 `transcribe` 子命令：把任意 Apple Podcasts / RSS 链接的音频下载下来，
通过 **阿里云通义听悟** 转写为带时间戳、说话人分离、章节标记的 Markdown 沉淀到 `data/`。

### 工作流

```
yt-dlp 下载音频  →  MinIO/S3 上传  →  通义听悟 ASR  →  data/*.md
```

### 前置准备

1. 安装 `yt-dlp`：

   ```bash
   brew install yt-dlp
   ```

2. 在阿里云控制台开通通义听悟并创建 App：
   - AccessKey：https://ram.console.aliyun.com/manage/accesskey
   - 通义听悟：https://tingwu.console.aliyun.com/
   - 授权策略：`AliyunTingwuFullAccess`

3. 启动 MinIO 并确保桶可公网访问（通义听悟要能 GET 到音频）：

   ```bash
   docker compose up -d minio
   ```

4. 在 `.env` 中填入：

   ```env
   ALIYUN_ACCESS_KEY_ID=...
   ALIYUN_ACCESS_KEY_SECRET=...
   TINGWU_APP_KEY=...
   S3_PUBLIC_URL=http://localhost:9000/leetcast   # 或 CDN / 阿里云 OSS 公开 URL
   ```

### 使用

```bash
pnpm --filter @leetcast/cli transcribe \
  --url "https://podcasts.apple.com/cn/podcast/teahour/id1486623337?i=1000761617014" \
  --title "Teahour #N - 标题" \
  --podcast "Teahour FM" \
  --hosts "Terry,Daniel" \
  --guests "Justin" \
  --tags "podcast,teahour,llm" \
  --hotwords "通义听悟,Rust" \
  --chapter
```

### 命令行参数

| Flag | 说明 |
|---|---|
| `--url` | 播客单集 URL（Apple Podcasts / RSS / 直链 mp3） |
| `--title` | 集标题（用于 Markdown 标题与文件名） |
| `--podcast` | 节目名（写入 frontmatter） |
| `--hosts` | 主持列表（按 Speaker 1, 2, … 顺序映射） |
| `--guests` | 嘉宾列表（接续 hosts 之后） |
| `--tags` | 逗号分隔的标签，写入 frontmatter |
| `--hotwords` | 逗号分隔的热词，用于 ASR 纠偏（人名、产品） |
| `--chapter` | 开启自动章节识别 |
| `--language` | 源语言（默认 `zh-CN`） |
| `--out-dir` | 输出目录（默认 `./data`） |
| `--downloads-dir` | 音频缓存目录（默认 `./downloads`） |

### 输出示例

`data/2026-07-10-Teahour-N-标题.md`：

```markdown
---
title: Teahour #N - 标题
podcast: Teahour FM
source: "https://podcasts.apple.com/..."
date: 2026-07-10
duration: 1h 32m
hosts: [Terry, Daniel]
guests: [Justin]
tags: [podcast, teahour, llm]
tingwu_task_id: abc123...
created_at: 2026-07-10T07:30:00.000Z
---

# Teahour #N - 标题

## 元信息
- **节目**: Teahour FM
- **来源**: <https://podcasts.apple.com/...>
- **主持**: Terry、Daniel
- **嘉宾**: Justin
- **时长**: 1h 32m

## 摘要
本期聊了...

## 章节速览
- **00:00** 开场
- **5:23** 嘉宾自我介绍

## 关键词
`大模型`、`RAG`、`Agent`

## 完整逐字稿
### [0:12] Terry（主持）
欢迎收听本期节目。

### [0:15] Justin（嘉宾）
我们今天聊聊大模型。
```

### 常见问题

- **`yt-dlp: command not found`** —— `brew install yt-dlp`
- **通义听悟报 `InvalidParameter.FileURL`** —— MinIO/S3 URL 不在公网。把桶设为公开读，或换成阿里云 OSS 的公开 URL
- **任务长时间停留在 `RUNNING`** —— 单集超过 4 小时会慢，用 `ffmpeg -i in.m4a -c copy -segment_time 7200 chunk_%02d.m4a` 切分后逐个提交
- **想换其他 ASR**（如 Whisper / 飞书妙记）—— 把 `packages/core/src/services/tingwu.ts` 换成对应实现即可，`transcript-formatter.ts` 接受的是结构化 JSON，调用方不变

---

## 部署

详见 [DEPLOY.md](./DEPLOY.md)。

快速参考：

```bash
# Worker Docker 镜像
docker build -t leetcast-worker apps/worker/

# 基础设施
docker compose up -d

# Web 推荐部署到 Vercel
# Worker 推荐 Docker / K8s
```

---

## 文档索引

| 文件 | 说明 |
|---|---|
| [DEPLOY.md](./DEPLOY.md) | 部署指南（Docker + Vercel） |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 + 开发规范 |
| [SECURITY.md](./SECURITY.md) | 安全策略 |
| [ENGINEERING.md](./ENGINEERING.md) | 工程设计文档 |
| [EVALUATION.md](./EVALUATION.md) | 项目评估报告 |

---

## 许可证

MIT License -- 详见 [LICENSE](./LICENSE)

---

**LeetCast** -- 每天五分钟，听懂一道 LeetCode。
