# --------------------------------------------------
# Stage 1: Full build (all deps + compile everything)
# --------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# Workspace root config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Package manifests (enables layer caching on dependency changes)
COPY apps/worker/package.json apps/worker/
COPY apps/cli/package.json apps/cli/
COPY frontend/package.json frontend/
COPY packages/core/package.json packages/core/
COPY packages/database/package.json packages/database/

# Install all dependencies (including dev for building)
RUN pnpm install --frozen-lockfile

# Source code
COPY . .

# Generate Prisma client
RUN pnpm --filter @leetcast/database db:generate

# Build shared packages → apps (turbo handles the dependency graph)
RUN pnpm build

# --------------------------------------------------
# Stage 2: Strip source files, keep runtime artifacts
# --------------------------------------------------
FROM builder AS production

# Remove source, config, and test files — keep dist/, node_modules/, .next/, prisma/, public/
RUN rm -rf \
  apps/*/src \
  packages/*/src \
  packages/database/prisma \
  frontend/src \
  "**/*.ts" \
  "**/*.tsx" \
  "**/tsconfig*.json" \
  "**/.eslintrc*" \
  "**/jest.config*" \
  "**/coverage" \
  "**/.turbo" \
  .turbo \
  data \
  && find . -name "*.map" -delete

# Create runtime directories
RUN mkdir -p downloads

ENV NODE_ENV=production
EXPOSE 3000

# Start both the BullMQ worker and the Next.js frontend
CMD ["sh", "-c", "node /app/apps/worker/dist/index.js & cd /app/frontend && exec npx next start -p 3000"]
