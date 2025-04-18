import type {RouteRecordRaw} from 'vue-router';

import {Help, Menu, Operation, User} from '@element-plus/icons-vue';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Help,
      keepAlive: true,
      order: 1001,
      title: '权限管理',
    },
    name: 'Authority',
    path: '/authority',
    children: [
      {
        meta: {
          title: '角色管理',
          icon: User,
        },
        name: 'Role',
        path: '/role/list',
        component: () => import('#/views/features/role/RoleList.vue'),
      },
      {
        meta: {
          title: '菜单管理',
          icon: Menu,
        },
        name: 'Menu',
        path: '/menu/list',
        component: () => import('#/views/features/menu/MenuList.vue'),
      },
      {
        meta: {
          title: '权限管理',
          icon: Operation,
        },
        name: 'Permission',
        path: '/permission/list',
        component: () =>
          import('#/views/features/permission/PermissionList.vue'),
      },
    ],
  },
];

export default routes;
