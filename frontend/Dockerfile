# syntax=docker/dockerfile:1.7

# ---------- Build SPA ----------
FROM node:22-alpine AS build
WORKDIR /src
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
# Chạy sau nginx cùng domain => gọi API bằng đường dẫn tương đối
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# ---------- Nginx gateway: phục vụ SPA + reverse proxy /api, /s3 ----------
FROM nginx:1.27-alpine
COPY --from=build /src/dist /usr/share/nginx/html
# Cấu hình thật được mount từ deploy/nginx/default.conf (xem docker-compose.yml)
EXPOSE 80
