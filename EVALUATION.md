# LeetCast 项目全面评估报告

评估日期: 2026-05-18

---

## 一、项目概况

LeetCast 是一个面向程序员的每日一题播客平台。利用 AI（GPT-4o / 阿里云百炼）生成 LeetCode 解题讲解脚本，再通过 ElevenLabs 多角色 TTS 合成音频，配合背景音乐生成完整播客。用户每日收听，追踪学习进度。

**Tech Stack:**
- Monorepo: pnpm workspace + Turborepo
- Frontend: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui
- Backend Worker: BullMQ + Redis
- Database: PostgreSQL + Prisma ORM
- Storage: MinIO / S3 兼容对象存储
- Auth: NextAuth v5 (GitHub OAuth, Prisma Adapter)
- AI/LLM: OpenAI API（兼容阿里云百炼 DashScope）
- TTS: ElevenLabs
- CLI: Commander.js + Prompts

**Code Scale:**
- 总 TS/TSX 源码: ~5,600 行
- 生产代码: ~5,300 行
- 测试代码: ~300 行
- 文件数 (源码): ~40 个 TS/TSX 文件
- 包/子包: 5 个 (cli, worker, web, core, database)

**Git Maturity:**
- 总提交: 7 次
- 分支策略: main + develop
- Dependabot: 已配置（7 个 pending PR）
- CI/CD: GitHub Actions (build/test/lint)

---

## 二、架构评估 — 评分：6/10

### 优点
- Monorepo 分层清晰：apps/ (cli, web, worker) + packages/ (core, database)，各包职责明确
- Prisma Schema 设计合理：8 个 model，合理的索引、级联删除、唯一约束
- 选题策略引擎（StrategyEngine）实现了三种策略：渐进/经典/弱项强化
- Worker 与 Web 分离，播客生成异步化（BullMQ），适合长任务场景
- 下一代 frontend (Next.js 14 App Router) 已接入 workspace

### 问题
1. 存在大量 "文件 2" 副本（如 apps 2/, packages 2/, src 2/ 等），严重影响仓库整洁度
2. root src/ 和 apps/cli/src/ 存在两套几乎相同的服务层代码，DUAL PATTERN 反模式
3. frontend/ 目录独立于 monorepo workspace（有自己的 .git/），未纳入 pnpm-workspace.yaml
4. apps/worker/src/index.ts 极简（13 行），队列消费者逻辑缺失
5. packages/core/src/index.ts re-export 多个模块，但实际模块来源不明确

---

## 三、代码质量 — 评分：6/10

### 优点
- TypeScript strict mode 开启，附加多项严格检查
- ESLint + Prettier 统一代码风格
- 代码命名规范，中文注释/日志清晰易读
- Prisma Client 单例模式正确实现

### 问题
1. ESLint 类型安全规则全部设为 "warn"，等效于关闭
2. .eslintrc.json 的 ignorePatterns 包含 "*.js"，所有 JS 文件被跳过
3. seed.ts 中存在 `any` 类型
4. AudioService 中类型断言不安全
5. ElevenLabs 返回值处理过于复杂，缺乏抽象

---

## 四、测试覆盖 — 评分：3/10

### 问题
1. 核心模块无测试：MCPService、StrategyEngine、AudioService、GraphQL Client
2. 前端无测试：0 组件测试、0 API 路由测试、0 E2E 测试
3. Worker 无测试
4. 现有测试仅覆盖辅助工具，不覆盖核心业务逻辑
5. CI 使用 npm ci 但项目实际用 pnpm

---

## 五、安全性 — 评分：5/10

### 问题
1. docker-compose.yml 硬编码默认密码
2. Admin Token 无 rate limiting
3. 无输入验证库（zod）
4. AudioService 存在路径遍历风险
5. SECURITY.md 联系邮箱是占位符
6. 无 CSP / Helmet

---

## 六、性能 — 评分：5/10

### 问题
1. 前端无代码分割/懒加载
2. Player 波形可视化无 memo 优化
3. 播放进度保存未做防抖
4. Seed 脚本无并发控制
5. PWA 支持不完整
6. 无音频流式传输

---

## 七、开发体验 — 评分：7/10

### 问题
1. CONTRIBUTING.md 使用 npm 而非 pnpm
2. CI workflow 使用 npm ci
3. Dockerfile 使用 npm ci
4. README 与实际 workspace 配置不一致
5. pnpm-workspace.yaml 不包含 frontend/

---

## 总评：5.5/10

最突出的优势:
1. 产品定位清晰，差异化明显（LeetCode + Podcast）
2. Monorepo 工程化基础设施搭建完整
3. 文档覆盖全面，开发规范有据可循

最需要改进的方面:
1. 清理仓库中的 " 2" 副本和死代码
2. 消除 DUAL PATTERN，统一服务层
3. 大幅提升测试覆盖率
4. 修复 npm/pnpm 不一致问题
5. 加强安全防护（输入验证、路径安全、默认密码）
