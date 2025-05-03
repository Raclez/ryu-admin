import { defineConfig } from '@vben/vite-config';

import AutoImport from 'unplugin-auto-import/vite';
import ElementPlus from 'unplugin-element-plus/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
        AutoImport({
          resolvers: [ElementPlusResolver()],
        }),
        Components({
          resolvers: [ElementPlusResolver()],
        }),
      ],
      build: {
        rollupOptions: {
          external: [
            'node:module',
            'node:process',
            'node:url',
            'node:fs',
            'node:path',
            'node:assert',
            'node:crypto',
            'node:tty',
            'node:perf_hooks',
            'node:vm',
            'node:os',
            'node:v8',
            'node:util'
          ]
        },
        target: 'es2022'
      },
      resolve: {
        alias: {
          '@vben-core/tabs-ui': fileURLToPath(new URL('../../packages/@core/ui-kit/tabs-ui/src/index.ts', import.meta.url)),
          '@vben-core/icons': fileURLToPath(new URL('../../packages/@core/base/icons/src/index.ts', import.meta.url)),
          '@vben-core/composables': fileURLToPath(new URL('../../packages/@core/composables/src/index.ts', import.meta.url))
        }
      }
      // ,
      // server: {
      //   proxy: {
      //     '/api': {
      //       changeOrigin: true,
      //       rewrite: (path) => path.replace(/^\/api/, ''),
      //       // mock代理目标地址
      //       target: 'http://localhost:7200/api',
      //       ws: true,
      //     },
      //   },
      // },
    },
  };
});
