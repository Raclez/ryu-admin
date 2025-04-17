import type {RouteRecordRaw} from "vue-router";

import {CreditCard, Postcard, Reading, Ticket} from '@element-plus/icons-vue'
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Postcard,
      keepAlive: true,
      order: 1000,
      title: '博客管理',
    },
    name: 'Posts',
    path: '/posts',
    children: [
      {
        meta: {
          title: '博客管理',
          icon: Reading
        },
        name: 'PostPage',
        path: '/posts/page',
        component: () => import('#/views/demos/posts/index.vue'),
      },
      {
        meta: {
          title: '博客编辑',
          hideInMenu: true,
        },
        name: 'PostEditor',
        path: '/posts/save/:id?',
        component: () => import('#/views/demos/posts/BlogEditor.vue'),
      },

      {
        meta: {
          title: '博客版本历史',
          hideInMenu: true,
        },
        name: 'PostVersion',
        path: '/posts/historyVersion/:id?',
        component: () => import('#/views/demos/posts/historyVersion.vue'),
      },
      {
        meta: {
          title: '分类管理',
          icon: Ticket
        },
        name: 'CategoryPage',
        path: '/category/page',
        component: () => import('#/views/demos/category/index.vue'),
      },
      {
        meta: {
          title: '标签管理',
          icon: CreditCard
        },
        name: 'TagsPage',
        path: '/tags/page',
        component: () => import('#/views/demos/tags/index.vue'),
      }


    ],
  },
];

export default routes;
