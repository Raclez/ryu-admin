FROM node:20-slim AS builder

# --max-old-space-size
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV TZ=Asia/Shanghai

RUN corepack enable

WORKDIR /app

# copy package.json and pnpm-lock.yaml to workspace
COPY . /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# 构建基础内部依赖包
RUN cd internal/tsconfig && pnpm unbuild --stub && \
    cd ../../internal/vite-config && pnpm unbuild --stub && \
    cd ../../internal/node-utils && pnpm unbuild --stub && \
    cd ../../internal/tailwind-config && pnpm unbuild --stub && \
    cd ../../packages/@core/base/typings && pnpm unbuild --stub && \
    cd ../shared && pnpm unbuild --stub && \
    cd ../icons && pnpm unbuild --stub

# 再构建其他内部包
RUN cd /app && pnpm --filter="@vben-core/*" build || true
RUN cd /app && pnpm --filter=./internal build || true
RUN cd /app && pnpm --filter=./packages build || true

# 构建effects目录下的包
RUN cd /app && pnpm --filter=./packages/effects build || true

# 最后构建web-ele应用
RUN cd /app/apps/web-ele && pnpm build

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf
COPY --from=builder /app/apps/web-ele/dist /usr/share/nginx/html

COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

# start nginx
CMD ["nginx", "-g", "daemon off;"]
