# 🎙️ LeetCast

[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**LeetCast** 是一个面向程序员的每日一题播客平台。每天登录，听一集 LeetCode 解题讲解播客，利用碎片时间提升算法能力。

---

## ✨ 核心特性

- 🎧 **每日一题播客**：AI 生成多角色对话式讲解，配合背景音乐与片头片尾
- 🤖 **AI 深度解析**：OpenAI GPT-4o 生成思路、代码 walkthrough、复杂度分析
- 🔊 **顶级音质**：ElevenLabs 多角色语音合成，主持人 + 资深工程师双人对谈
- 🔍 **海量题库**：LeetCode Top 100 实时同步，支持标签/难度筛选
- 💾 **学习追踪**：播放进度自动保存、连续打卡、排行榜、分享海报
- 🛠️ **Admin 后台**：三种选题策略（难度渐进 / 经典题单 / 弱项强化）
- 🏗️ **Monorepo 架构**：Next.js Web + BullMQ Worker + PostgreSQL + Redis + S3

---

## 🚀 快速开始

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
cp .env.example apps/web/.env
cp .env.example apps/worker/.env
# 编辑 .env 填入 API Keys

### 接入阿里云百炼（可选）

若不想使用 OpenAI，可直接接入**阿里云百炼**的兼容模式。在 `apps/worker/.env` 中配置：

```env
OPENAI_API_KEY=sk-你的百炼Key
OPENAI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
OPENAI_MODEL=qwen-max
```

配置完成后触发一次每日播客生成（Admin 面板或 `curl POST /api/admin/daily`），即可看到：
- **脚本**：由百炼 `qwen-max` 生成真实的双人对话播客脚本。
- **音频**：若未配置 ElevenLabs，系统会 fallback 为 5 秒 mock 音频，但文字稿已经是真实 LLM 内容了。

> 如需完整真实音频，可额外配置 `ELEVENLABS_API_KEY`；或继续使用百炼的 CosyVoice 等国产 TTS 方案替换 ElevenLabs。

# 4. 启动基础设施（PostgreSQL + Redis + MinIO）
docker compose up -d

# 5. 构建共享包
pnpm --filter @leetcast/core build
pnpm --filter @leetcast/database build

# 6. 初始化数据库并填充题库
pnpm db:push
pnpm --filter database db:seed

# 7. 启动 Worker（终端 A）
pnpm --filter @leetcast/worker dev

# 8. 启动 Web（终端 B）
pnpm --filter @leetcast/web dev
```

访问 http://localhost:3000

Admin 后台：http://localhost:3000/admin

---

## 🏗️ 项目架构

```
leetcast/
├── apps/
│   ├── cli/              # 原始 CLI 工具（保留）
│   └── worker/           # BullMQ Worker（播客生成）
├── frontend/             # Next.js 14 Web App (独立 workspace)
├── packages/
│   ├── core/             # 共享业务逻辑（LeetCode API、TTS、FFmpeg 混音）
│   └── database/         # Prisma + 数据库访问 + 选题策略
├── docker-compose.yml    # 本地基础设施（PostgreSQL + Redis + MinIO）
├── DEPLOY.md             # 部署指南
└── EVALUATION.md         # 项目评估报告
```

---

## 📈 已完成功能

- [x] Monorepo + Turborepo 工程化
- [x] PostgreSQL + Prisma 数据模型
- [x] Redis + BullMQ 任务队列
- [x] MinIO / S3 对象存储
- [x] 多角色播客脚本生成（GPT-4o）
- [x] 多角色音频合成 + FFmpeg 混音（BGM + 片头片尾）
- [x] GitHub OAuth 登录
- [x] 每日一题首页 + 自定义播放器
- [x] 播放进度自动保存 + 打卡逻辑
- [x] 题单浏览 + 搜索 + 筛选
- [x] 个人中心（打卡日历、学习统计）
- [x] 排行榜
- [x] 分享海报 SVG
- [x] Admin 后台（选题策略 + 发布）
- [x] Worker Docker 镜像 + 部署文档

---

## 🤝 贡献指南

见 [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 许可证

MIT License

---

**LeetCast** - 让算法学习更简单、更高效。
