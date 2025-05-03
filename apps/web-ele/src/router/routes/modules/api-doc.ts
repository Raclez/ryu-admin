import type {RouteRecordRaw} from 'vue-router';
import {Apple, CreditCard} from '@element-plus/icons-vue';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: CreditCard,
      keepAlive: true,
      order: 2000,
      title: '接口管理',
    },
    name: 'Api',
    path: '/api',
    children: [
      {
        name: 'ApiDoc',
        path: '/api-doc',
        component: () => import('#/views/api-doc/index.vue'),
        meta: {
          title: 'API文档',
          icon: Apple,
        },
      }
    ]
  },
];

export default routes;
