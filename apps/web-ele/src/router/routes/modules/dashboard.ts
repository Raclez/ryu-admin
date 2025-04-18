import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/blog-dashboard',
    meta: {
      hideInMenu: true,
    },
    children: [
      {
        name: 'BlogDashboard',
        path: 'blog-dashboard',
        component: () => import('#/views/dashboard/blog-dashboard/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:book',
          title: '首页',
          hideInMenu: true,
        },
      },
      // {
      //   name: 'Analytics',
      //   path: '/analytics',
      //   component: () => import('#/views/dashboard/analytics/index.vue'),
      //   meta: {
      //     affixTab: true,
      //     icon: 'lucide:area-chart',
      //     title: $t('page.dashboard.analytics'),
      //   },
      // },
      // {
      //   name: 'Workspace',
      //   path: '/workspace',
      //   component: () => import('#/views/dashboard/workspace/index.vue'),
      //   meta: {
      //     icon: 'carbon:workspace',
      //     title: $t('page.dashboard.workspace'),
      //   },
      // },
    ],
  },
];

export default routes;
