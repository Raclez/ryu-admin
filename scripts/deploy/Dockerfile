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

# 为缺少src目录的包创建空的src目录并复制基础配置
RUN mkdir -p internal/tsconfig/src \
    && mkdir -p internal/vite-config/src \
    && mkdir -p internal/node-utils/src \
    && mkdir -p internal/tailwind-config/src \
    && mkdir -p packages/@core/base/typings/src \
    && mkdir -p packages/@core/base/shared/src \
    && mkdir -p packages/@core/base/icons/src \
    && mkdir -p node_modules/@vben \
    && cp -r internal/tsconfig node_modules/@vben/ \
    && cp -r internal/vite-config node_modules/@vben/ \
    && cp -r internal/node-utils node_modules/@vben/ \
    && cp -r internal/tailwind-config node_modules/@vben/ \
    && mkdir -p node_modules/@vben/tsconfig \
    && cp internal/tsconfig/*.json node_modules/@vben/tsconfig/

# 构建内部包
RUN cd /app && pnpm --filter="@vben-core/*" build || true
RUN cd /app && pnpm --filter=./internal build || true
RUN cd /app && pnpm --filter=./packages build || true
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
