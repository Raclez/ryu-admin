import type { RouteRecordRaw } from 'vue-router';
import { Picture, Rank } from '@element-plus/icons-vue';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Rank,
      keepAlive: true,
      order: 1001,
      title: '资源管理',
    },
    name: 'Resource',
    path: '/resource',
    children: [
      {
        meta: {
          title: '资源管理',
          icon: Picture,
        },
        name: 'PictureMange',
        path: '/resource/picture',
        component: () => import('#/views/demos/resource/picture.vue'),
      },
      // {
      //   meta: {
      //     title: '菜单管理',
      //     icon: Menu
      //   },
      //   name: 'Menus',
      //   path: '/menus/tree',
      //   component: () => import('#/views/demos/menus/index.vue'),
      // },
      // {
      //   meta: {
      //     title: '标签管理',
      //   },
      //   name: 'TagsPage',
      //   path: '/tags/page',
      //   component: () => import('#/views/demos/tags/index.vue'),
      // }
      //
    ],
  },
];

export default routes;
