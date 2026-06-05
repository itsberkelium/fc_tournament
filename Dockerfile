FROM node:22-alpine AS base

# Stage 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and the Prisma schema
COPY package.json package-lock.json* ./
COPY ./prisma ./prisma/
COPY prisma.config.ts ./prisma.config.ts

# Install dependencies and generate the Prisma Client
RUN npm ci
RUN npx prisma generate

# Stage 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# Stage 3: Production server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output and static files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

COPY --from=deps /app/prisma ./prisma/
COPY --from=deps /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js server
CMD ["node", "server.js"]