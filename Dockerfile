# ============================================================
# Stage 1: Builder
# ============================================================
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files (pnpm workspace)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json (for dependency resolution)
COPY backend/package.json ./backend/

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Copy source code for backend
COPY backend/ ./backend/

# Build the backend application
RUN cd backend && pnpm build

# ============================================================
# Stage 2: Runner (Production)
# ============================================================
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy built artifacts from builder
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/prisma ./prisma

# Generate Prisma client (required for production)
RUN pnpm prisma generate

# Expose the port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the application
CMD ["node", "dist/main"]