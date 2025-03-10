import type {RouteRecordRaw} from "vue-router";
import {Help, Menu, User} from '@element-plus/icons-vue'
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Help,
      keepAlive: true,
      order: 1001,
      title: '权限管理',
    },
    name: 'Authority',
    path: '/roles',
    children: [
      {
        meta: {
          title: '角色管理',
          icon: User,
        },
        name: 'Role',
        path: '/roles/list',
        component: () => import('#/views/demos/roles/index.vue'),
      },
      {
        meta: {
          title: '菜单管理',
          icon: Menu
        },
        name: 'Menus',
        path: '/menus/tree',
        component: () => import('#/views/demos/menus/index.vue'),
      },
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
