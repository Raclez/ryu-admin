import type {RouteRecordRaw} from 'vue-router';

import {CreditCard, Postcard, Reading, Ticket} from '@element-plus/icons-vue';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Postcard,
      keepAlive: true,
      order: 1000,
      title: '内容管理',
    },
    name: 'Content',
    path: '/content',
    children: [
      {
        meta: {
          title: '文章管理',
          icon: Reading,
        },
        name: 'ArticleList',
        path: '/article/list',
        component: () => import('#/views/features/article/ArticleList.vue'),
      },
      {
        meta: {
          title: '文章编辑',
          hideInMenu: true,
        },
        name: 'ArticleEditor',
        path: '/article/edit/:id?',
        component: () => import('#/views/features/article/ArticleEditor.vue'),
      },
      {
        meta: {
          title: '版本历史',
          hideInMenu: true,
        },
        name: 'ArticleHistory',
        path: '/article/history/:id',
        component: () => import('#/views/features/article/ArticleHistory.vue'),
      },
      {
        meta: {
          title: '分类管理',
          icon: Ticket,
        },
        name: 'CategoryList',
        path: '/category/list',
        component: () => import('#/views/features/category/CategoryList.vue'),
      },
      {
        meta: {
          title: '标签管理',
          icon: CreditCard,
        },
        name: 'TagList',
        path: '/tag/list',
        component: () => import('#/views/features/tag/TagList.vue'),
      },
    ],
  },
];

export default routes;
