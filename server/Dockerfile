# Multi-stage production Dockerfile for Inbox Companion Backend
# Stage 1: Build & Prune
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json ./
COPY src/ ./src/

RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Minimal Runtime Environment
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Security: Create non-root unprivileged user and group
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy pruned production dependencies and compiled artifacts
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs --from=builder /usr/src/app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /usr/src/app/dist ./dist

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check using HTTP endpoint
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/v1/health || exit 1

CMD ["node", "dist/main.js"]
