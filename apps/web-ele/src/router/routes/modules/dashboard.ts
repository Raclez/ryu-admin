import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    component: () => import('#/views/dashboard/blog-dashboard/index.vue'),
    meta: {
      affixTab: true,
      icon: 'lucide:book',
      title: '首页',
      hideInMenu: true,
    },
  },
];

export default routes;
