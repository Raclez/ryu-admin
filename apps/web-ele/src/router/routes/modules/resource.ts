import type { RouteRecordRaw } from 'vue-router';
import {CreditCard, Picture, Rank} from '@element-plus/icons-vue';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Rank,
      keepAlive: true,
      order: 1001,
      title: '资源管理',
    },
    name: 'ResourceManagement',
    path: '/resource-management',
    children: [
      {
        meta: {
          title: '资源列表',
          icon: Picture,
        },
        name: 'ResourceList',
        path: '/resource/list',
        component: () => import('#/views/features/resource/ResourceList.vue'),
      },
      {
        path: '/disk/files',
        name: 'DiskManager',
        component: () => import('#/views/features/disk/DiskManager.vue'),
        meta: {
          title: '网盘管理',
          icon: CreditCard,
        },
      },
    ],
  },
];

export default routes;
