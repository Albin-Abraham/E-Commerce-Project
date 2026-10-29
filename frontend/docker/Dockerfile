# Multi-stage Dockerfile for React Vite Frontend
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Selects the axios profile in src/core/configs/api/axios/axios.env.ts and
# which docker/env/<mode>.env is materialised into .env.<mode>.
# VITE_ENV was the old name and nothing ever read it, so CI was silently
# shipping the development profile.
ARG VITE_APP_ENV=production
ENV VITE_APP_ENV=${VITE_APP_ENV}

WORKDIR /app

# Enable pnpm package manager
RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application source files & environment configs
COPY . .

# Every .env* path is gitignored, so none of them are in the build context.
# Materialise the two files Vite needs for this build mode from the
# version-controlled sources. scripts/ensure-env.js does the same locally.
RUN cp .env.example .env \
    && cp "docker/env/${VITE_APP_ENV}.env" ".env.${VITE_APP_ENV}" \
    && echo "--- provisioning env files ---" \
    && ls -1 .env .env.example ".env.${VITE_APP_ENV}" \
    && echo "--- VITE_APP_ENV=${VITE_APP_ENV} ---"

# Build bundle into /dist using the mode matching VITE_APP_ENV.
# build_app.js runs the token + type integrity checks before bundling.
RUN pnpm build --mode "$VITE_APP_ENV"

# Stage 2: Nginx Web Server Stage
FROM nginx:alpine AS runner

# Clean default Nginx html assets
RUN rm -rf /usr/share/nginx/html/*

# Copy Nginx template configuration
COPY docker/nginx/nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy production build assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy entrypoint script for dynamic runtime env browser exposure
COPY docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
