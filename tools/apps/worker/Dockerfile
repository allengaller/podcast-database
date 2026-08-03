# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/database/package.json packages/database/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @leetcast/worker...

# Copy source code
COPY . .

# Build shared packages then worker
RUN pnpm --filter @leetcast/core build && pnpm --filter @leetcast/database build
RUN pnpm --filter @leetcast/worker build

# Production stage
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/worker/package.json apps/worker/package.json
COPY --from=builder /app/apps/worker/dist apps/worker/dist
COPY --from=builder /app/packages/core/package.json packages/core/package.json
COPY --from=builder /app/packages/core/dist packages/core/dist
COPY --from=builder /app/packages/database/package.json packages/database/package.json
COPY --from=builder /app/packages/database/dist packages/database/dist

RUN pnpm install --frozen-lockfile --filter @leetcast/worker --prod

# Create downloads directory
RUN mkdir -p downloads

ENV NODE_ENV=production

CMD ["node", "apps/worker/dist/index.js"]
