# better-sqlite3 là native module, nên dùng base image Debian (glibc) thay vì
# Alpine (musl) để tối đa khả năng dùng được prebuilt binary thay vì phải tự
# biên dịch trên thiết bị ARM yếu.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
# Toolchain build phòng trường hợp không có prebuilt binary cho kiến trúc máy chủ.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy toàn bộ (kể cả devDependencies) để chắc chắn không thiếu dependency
# nào lúc runtime, chấp nhận đánh đổi image to hơn một chút.
COPY --from=builder /app ./
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
