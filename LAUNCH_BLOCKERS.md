# LeetCast 发布阻断清单

日期: 2026-05-18

---

## 一、阻断级 (Blocking) — 不修不能上线

### 1. 编译产物混入源码
packages/core/src/ 和 packages/database/src/ 中存在 .js/.d.ts/.js.map 文件（如 index.js, podcast-engine.js 等），
这些是编译产物，不应出现在 src/ 中。会导致：
- 导入混乱（import 可能命中 .js 而非 .ts）
- git diff 污染
- 与 dist/ 重复

### 2. frontend/ 有独立 .git/ 目录
frontend/ 是一个独立 git 仓库，嵌套在 monorepo 中会导致：
- pnpm workspace 的 git 依赖解析异常
- 子模块冲突
- CI checkout 行为不一致

### 3. .env 未配置
.env.example 是模板，但没有实际可用的 .env 文件。首次启动需要：
- PostgreSQL 连接字符串
- Redis URL
- MinIO / S3 凭证
- AUTH_SECRET
- GitHub OAuth Client ID/Secret

### 4. pnpm install 未执行
修复报告中添加了 zod 依赖到 frontend/package.json，但未执行 pnpm install。
所有新增依赖（zod）在 node_modules 中不存在。

### 5. 根 Dockerfile 已过时
根目录 Dockerfile 仍使用 npm ci，且 CMD 指向 dist/cli.js（旧结构），
未适配 monorepo。apps/worker/Dockerfile 已修复，但根 Dockerfile 仍是旧的。

---

## 二、高优先级 (High) — 上线前必须修

### 6. 根级 src/ 与 apps/cli/src/ 重复
root src/ 下有完整的 services/、utils/、types/、__tests__/，
apps/cli/src/ 也有 cli.ts + mcp-server.ts。
两边的服务层代码几乎相同（DUAL PATTERN），应统一为 packages/core。

### 7. 页面组件直接查数据库（无 API 层）
- frontend/src/app/page.tsx — 直接 prisma.podcast.findFirst()
- frontend/src/app/problems/page.tsx — 直接 prisma.problem.findMany()
- frontend/src/app/leaderboard/page.tsx — 直接 prisma.userProgress.findMany()
- frontend/src/app/profile/page.tsx — 直接 prisma 多表查询

虽然 Next.js RSC 允许这样做，但生产环境应通过 API 路由 + 缓存策略，
避免数据库连接暴露在边缘函数中。

### 8. 无错误监控/日志
- 无 Sentry / 错误上报
- Worker 只有 console.log/error
- 前端无错误边界
- 播客生成失败后无重试策略（BullMQ 默认有，但未配置 attempts/backoff）

### 9. API 路由无 rate limiting
- /api/progress — 每次进度更新都写数据库
- /api/admin/daily — 虽有 token 但无防暴力破解
- /api/problems — 查询无缓存控制

### 10. .gitignore 不完整
缺少：
- .next/
- .turbo/
- frontend/.next/
- data/
- *.pid
- .tmp/

### 11. generate-podcast.ts 中 chapters 类型问题
第 57 行: `chapters: result.chapters as any` — 应定义 Prisma 兼容的 JSON 类型。

---

## 三、中优先级 (Medium) — 影响体验

### 12. 无 Service Worker / 离线支持
manifest.json 存在但无 sw.js，PWA 安装后无法离线使用。

### 13. Seed 脚本串行请求
packages/database/src/seed.ts 顺序请求 100 道题详情，
无并发控制，首次部署耗时长（约 2-5 分钟）。

### 14. 音频无流式传输
音频 URL 返回完整 MP3，无 Range 请求支持，
长音频（5-8分钟）首次播放体验差。

### 15. 无健康检查端点
Worker 和 Web 都没有 /health 或 /readiness 端点，
Docker/K8s 无法做存活探针。

### 16. 无 CSP / 安全头
前端无 Content-Security-Policy、X-Frame-Options 等安全响应头。

### 17. StorageService 硬编码默认凭证
src/services/storage.ts 中 S3 credentials 默认值为 minioadmin，
生产环境如果忘记配置会连到公开 MinIO。

---

## 四、低优先级 (Nice-to-have)

### 18. 前端无 E2E 测试
Playwright / Cypress 测试为零，关键用户流程（登录→听播客→打卡）无覆盖。

### 19. 无国际化框架
界面是硬编码中文，无 i18n 支持。如果目标用户仅限中文社区可暂缓。

### 20. 无 Open Graph / SEO 元数据
页面无 og:image、og:description 等社交分享元数据。

### 21. CHANGELOG.md 内容为空模板
版本历史只有占位符，无实际变更记录。

### 22. 无定时任务调度
每日播客发布依赖 Admin 手动触发，无 Vercel Cron / GitHub Actions 定时发布。

---

## 建议修复顺序

Phase 1 (今天): #1 #2 #4 #5 #10 #11 — 清理环境，能跑起来
Phase 2 (本周): #3 #6 #7 #9 #16 #17 — 安全 + 架构统一
Phase 3 (上线前): #8 #12 #13 #14 #15 — 体验 + 可观测性
Phase 4 (上线后): #18 #19 #20 #21 #22 — 持续优化
