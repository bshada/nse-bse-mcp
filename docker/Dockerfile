# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install minimal build dependencies (only what's needed for canvas/pdf-parse)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Copy package files and source
COPY package.json tsconfig.json ./
COPY src ./src

# Install all dependencies and build
RUN npm install && npm run build

# Create production package.json without prepare script and install dependencies
RUN mkdir /prod-deps && cd /prod-deps && \
    node -e "const pkg=require('/app/package.json'); delete pkg.scripts.prepare; delete pkg.devDependencies; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2))" && \
    npm install

# Production stage - minimal runtime image
FROM node:20-alpine AS production

WORKDIR /app

# Install only essential runtime dependencies (no build tools, just runtime libs)
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    libjpeg-turbo \
    freetype \
    wget

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /prod-deps/node_modules ./node_modules

# Create downloads directory and set permissions
RUN mkdir -p downloads && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server directly with node (no npm overhead)
CMD ["node", "dist/index.js"]