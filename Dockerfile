FROM node:22-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
COPY ./prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

RUN npm ci

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (DOCKER=true enables standalone output mode)
ENV DOCKER=true
RUN npm run build

# Stage 3: Migrations — has full node_modules to load prisma.config.ts
FROM base AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma/
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts
CMD ["npx", "prisma", "migrate", "deploy"]

# Stage 4: Production server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
