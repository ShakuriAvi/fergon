# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines import.meta.env.VITE_API_URL into the bundle at build time (not
# readable at container runtime), so the backend URL must be supplied as a
# build arg — see infra/gcp/deploy-frontend-cloud-run.sh.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# ---- serve stage ----
FROM node:20-alpine
WORKDIR /app

RUN npm install --global serve@14 \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build --chown=appuser:appgroup /app/dist ./dist
USER appuser

# Cloud Run injects $PORT (default 8080) and requires the container to listen
# on it, unless overridden at build time. `serve -s` serves the static build
# and rewrites unknown paths to index.html (SPA fallback).
ARG PORT=8080
ENV PORT=${PORT}
EXPOSE ${PORT}
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
