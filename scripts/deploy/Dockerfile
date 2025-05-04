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

# 安装依赖并创建缺失的包
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

# 创建缺失的tsconfig包
RUN mkdir -p packages/@vben/tsconfig
RUN echo '{\
  "name": "@vben/tsconfig",\
  "version": "1.0.0",\
  "main": "index.js",\
  "files": ["*.json"]\
}' > packages/@vben/tsconfig/package.json

# 创建基础的tsconfig文件
RUN echo '{\
  "$schema": "https://json.schemastore.org/tsconfig",\
  "display": "Default",\
  "compilerOptions": {\
    "target": "ESNext",\
    "module": "ESNext",\
    "moduleResolution": "Bundler",\
    "strict": true,\
    "esModuleInterop": true,\
    "skipLibCheck": true,\
    "forceConsistentCasingInFileNames": true\
  }\
}' > packages/@vben/tsconfig/base.json

RUN echo '{\
  "$schema": "https://json.schemastore.org/tsconfig",\
  "display": "Web Application",\
  "extends": "./base.json",\
  "compilerOptions": {\
    "lib": ["ESNext", "DOM", "DOM.Iterable"],\
    "types": ["vite/client"]\
  }\
}' > packages/@vben/tsconfig/web-app.json

RUN echo '{\
  "$schema": "https://json.schemastore.org/tsconfig",\
  "display": "Web",\
  "extends": "./base.json",\
  "compilerOptions": {\
    "lib": ["ESNext", "DOM", "DOM.Iterable"]\
  }\
}' > packages/@vben/tsconfig/web.json

RUN echo '{\
  "$schema": "https://json.schemastore.org/tsconfig",\
  "display": "Node",\
  "extends": "./base.json",\
  "compilerOptions": {\
    "module": "ESNext",\
    "moduleResolution": "Bundler"\
  }\
}' > packages/@vben/tsconfig/node.json

RUN echo '{\
  "$schema": "https://json.schemastore.org/tsconfig",\
  "display": "Library",\
  "extends": "./base.json",\
  "compilerOptions": {\
    "declaration": true,\
    "declarationMap": true\
  }\
}' > packages/@vben/tsconfig/library.json

# 创建缺失的vite-config包
RUN mkdir -p packages/@vben/vite-config/src
RUN echo '{\
  "name": "@vben/vite-config",\
  "version": "1.0.0",\
  "type": "module",\
  "main": "src/index.js"\
}' > packages/@vben/vite-config/package.json

# 使用多行写入的方式避免Dockerfile解析出错
RUN cat > packages/@vben/vite-config/src/index.js << 'EOF'
import { defineConfig as viteDefineConfig } from "vite";

function defineConfig(fn) {
  return async () => {
    const config = await fn();
    return viteDefineConfig(config.vite);
  };
}

export default defineConfig;
EOF

# 创建缺失的types包
RUN mkdir -p packages/@vben/types
RUN echo '{\
  "name": "@vben/types",\
  "version": "1.0.0",\
  "types": "global.d.ts"\
}' > packages/@vben/types/package.json

RUN cat > packages/@vben/types/global.d.ts << 'EOF'
// 全局类型定义
declare global {
  interface Window {
    [key: string]: any;
  }
}
EOF

# 确保@vben-core/shared/cache目录存在并创建必要的文件
RUN mkdir -p packages/@core/base/shared/src/cache

RUN cat > packages/@core/base/shared/src/cache/index.ts << 'EOF'
// 缓存实现
import { createStorage } from "../utils/storage";

// 默认缓存时间
export const DEFAULT_CACHE_TIME = 60 * 60 * 24 * 7; // 7天

// 创建localStorage缓存
export const createLocalStorage = (options = {}) => {
  return createStorage({
    storage: localStorage,
    ...options,
  });
};

// 创建sessionStorage缓存
export const createSessionStorage = (options = {}) => {
  return createStorage({
    storage: sessionStorage,
    ...options,
  });
};

export const defaultCache = createLocalStorage();

// 导出常用的存储操作方法
export class Cache {
  private cache: ReturnType<typeof createStorage>;

  constructor(storage = defaultCache) {
    this.cache = storage;
  }

  get<T = any>(key: string, def: T | null = null): T {
    return this.cache.get(key) || def;
  }

  set(key: string, value: any, expire = DEFAULT_CACHE_TIME) {
    this.cache.set(key, value, expire);
  }

  remove(key: string) {
    this.cache.remove(key);
  }

  clear() {
    this.cache.clear();
  }
}
EOF

# 确保utils目录下有storage.ts文件
RUN mkdir -p packages/@core/base/shared/src/utils

RUN cat > packages/@core/base/shared/src/utils/storage.ts << 'EOF'
// 存储工具函数
export interface StorageOption {
  storage: Storage;
  prefix?: string;
}

export interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

export interface CreateStorageParams extends StorageOption {
  timeout?: number;
}

export function createStorage({
  storage = localStorage,
  prefix = "",
  timeout = 0,
}: Partial<CreateStorageParams> = {}) {
  function getKey(key: string) {
    return `${prefix}${key}`.toUpperCase();
  }

  function set(key: string, value: any, expire = timeout) {
    const stringData = JSON.stringify({
      value,
      expire: expire !== 0 ? new Date().getTime() + expire * 1000 : 0,
    });
    storage.setItem(getKey(key), stringData);
  }

  function get(key: string) {
    const item = storage.getItem(getKey(key));
    if (!item) return null;

    try {
      const data = JSON.parse(item);
      const { value, expire } = data;
      // 无过期时间或者未过期返回缓存的值
      if (expire === 0 || expire > new Date().getTime()) {
        return value;
      }
      // 过期则删除
      remove(key);
      return null;
    } catch (e) {
      return null;
    }
  }

  function remove(key: string) {
    storage.removeItem(getKey(key));
  }

  function clear() {
    storage.clear();
  }

  return {
    set,
    get,
    remove,
    clear,
  };
}
EOF

# 重新链接依赖
RUN pnpm install --no-frozen-lockfile

# 执行构建
RUN cd apps/web-ele && pnpm run build

RUN echo "Builder Success 🎉"

FROM nginx:stable-alpine AS production

RUN echo "types { application/javascript js mjs; }" > /etc/nginx/conf.d/mjs.conf
COPY --from=builder /app/apps/web-ele/dist /usr/share/nginx/html

COPY --from=builder /app/scripts/deploy/nginx.conf /etc/nginx/nginx.conf

HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget -q -O /dev/null http://localhost:8080/health || exit 1

EXPOSE 8080

# start nginx
CMD ["nginx", "-g", "daemon off;"]
