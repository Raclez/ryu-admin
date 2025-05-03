import type {RouteRecordRaw} from 'vue-router';
import {Cpu, Connection, Monitor} from '@element-plus/icons-vue';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Cpu,
      keepAlive: true,
      order: 2000,
      title: 'Arthas工具',
    },
    name: 'ArthasTools',
    path: '/arthas',
    children: [
      {
        meta: {
          title: 'Arthas管理',
          icon: Monitor,
        },
        name: 'ArthasManager',
        path: '/arthas/index',
        component: () => import('#/views/features/arthas/index.vue'),
      },
      {
        meta: {
          title: '模块功能',
          icon: Connection,
          hideInMenu: true,
        },
        name: 'ArthasModule',
        path: '/arthas/module',
        component: () => import('#/views/features/arthas/ArthasModule.vue'),
      },
      {
        meta: {
          title: '命令控制台',
          icon: Connection,
          hideInMenu: true,
        },
        name: 'ArthasConsole',
        path: '/arthas/console',
        component: () => import('#/views/features/arthas/ArthasConsole.vue'),
      },
    ],
  },
];

export default routes;
