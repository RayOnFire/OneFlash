# ================================
# 基础镜像
# ================================
FROM node:22-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache libc6-compat

# 启用 corepack 以使用 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ================================
# 依赖安装阶段
# ================================
FROM base AS deps

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ================================
# 构建阶段
# ================================
FROM base AS builder

WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建应用
RUN pnpm build

# ================================
# 生产运行阶段
# ================================
FROM node:22-alpine AS runner

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制公共资源
COPY --from=builder /app/public ./public

# 设置正确的缓存目录权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制 standalone 输出
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]

