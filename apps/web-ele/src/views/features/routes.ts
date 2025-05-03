// import type { RouteRecordRaw } from 'vue-router';

// /**
//  * Features模块路由配置
//  */
// const routes: RouteRecordRaw[] = [
//   // =========== 内容管理 ===========
//   {
//     path: '/article',
//     name: 'Article',
//     component: () => import('./article/index.vue'),
//     meta: {
//       title: '文章管理',
//       icon: 'document',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'ArticleList',
//         component: () => import('./article/ArticleList.vue'),
//         meta: {
//           title: '文章列表',
//         },
//       },
//       {
//         path: 'edit/:id?',
//         name: 'ArticleEditor',
//         component: () => import('./article/ArticleEditor.vue'),
//         meta: {
//           title: '编辑文章',
//           hideInMenu: true,
//         },
//       },
//       {
//         path: 'history/:id',
//         name: 'ArticleHistory',
//         component: () => import('./article/ArticleHistory.vue'),
//         meta: {
//           title: '版本历史',
//           hideInMenu: true,
//         },
//       },
//     ],
//   },
//   {
//     path: '/category',
//     name: 'Category',
//     component: () => import('./category/index.vue'),
//     meta: {
//       title: '分类管理',
//       icon: 'folder',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'CategoryList',
//         component: () => import('./category/CategoryList.vue'),
//         meta: {
//           title: '分类列表',
//         },
//       },
//     ],
//   },
//   {
//     path: '/tag',
//     name: 'Tag',
//     component: () => import('./tag/index.vue'),
//     meta: {
//       title: '标签管理',
//       icon: 'tags',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'TagList',
//         component: () => import('./tag/TagList.vue'),
//         meta: {
//           title: '标签列表',
//         },
//       },
//     ],
//   },

//   // =========== 系统管理 ===========
//   {
//     path: '/system-config',
//     name: 'SystemConfig',
//     component: () => import('./system-config/index.vue'),
//     meta: {
//       title: '系统配置',
//       icon: 'setting',
//     },
//     children: [
//       {
//         path: 'form',
//         name: 'SystemConfigForm',
//         component: () => import('./system-config/SystemConfigForm.vue'),
//         meta: {
//           title: '系统配置',
//         },
//       },
//     ],
//   },
//   {
//     path: '/system',
//     name: 'SystemLog',
//     component: () => import('./system/index.vue'),
//     meta: {
//       title: '系统日志',
//       icon: 'warning',
//     },
//     children: [
//       {
//         path: 'log',
//         name: 'SystemLogList',
//         component: () => import('./system/SystemLog.vue'),
//         meta: {
//           title: '系统日志',
//         },
//       },
//     ],
//   },
//   {
//     path: '/menu',
//     name: 'Menu',
//     component: () => import('./menu/index.vue'),
//     meta: {
//       title: '菜单管理',
//       icon: 'menu',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'MenuList',
//         component: () => import('./menu/MenuList.vue'),
//         meta: {
//           title: '菜单列表',
//         },
//       },
//     ],
//   },

//   // =========== 权限管理 ===========
//   {
//     path: '/user',
//     name: 'User',
//     component: () => import('./user/index.vue'),
//     meta: {
//       title: '用户管理',
//       icon: 'user',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'UserList',
//         component: () => import('./user/UserList.vue'),
//         meta: {
//           title: '用户列表',
//         },
//       },
//     ],
//   },
//   {
//     path: '/role',
//     name: 'Role',
//     component: () => import('./role/index.vue'),
//     meta: {
//       title: '角色管理',
//       icon: 'user',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'RoleList',
//         component: () => import('./role/RoleList.vue'),
//         meta: {
//           title: '角色列表',
//         },
//       },
//     ],
//   },
//   {
//     path: '/permission',
//     name: 'Permission',
//     component: () => import('./permission/index.vue'),
//     meta: {
//       title: '权限管理',
//       icon: 'lock',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'PermissionList',
//         component: () => import('./permission/PermissionList.vue'),
//         meta: {
//           title: '权限列表',
//         },
//       },
//     ],
//   },

//   // =========== 资源管理 ===========
//   {
//     path: '/resource',
//     name: 'Resource',
//     component: () => import('./resource/index.vue'),
//     meta: {
//       title: '资源管理',
//       icon: 'picture',
//     },
//     children: [
//       {
//         path: 'list',
//         name: 'ResourceList',
//         component: () => import('./resource/ResourceList.vue'),
//         meta: {
//           title: '资源列表',
//         },
//       },
//     ],
//   },
//   {
//     path: '/disk',
//     name: 'Disk',
//     component: () => import('./disk/index.vue'),
//     meta: {
//       title: '网盘管理',
//       icon: 'folder-opened',
//     },
//     children: [
//       {
//         path: 'files',
//         name: 'DiskManager',
//         component: () => import('./disk/DiskManager.vue'),
//         meta: {
//           title: '文件管理',
//         },
//       },
//     ],
//   },

//   // =========== 辅助功能 ===========
//   {
//     path: '/dict',
//     name: 'Dict',
//     component: () => import('./dict/index.vue'),
//     meta: {
//       title: '字典管理',
//       icon: 'notebook',
//     },
//     children: [
//       {
//         path: 'type',
//         name: 'DictType',
//         component: () => import('./dict/type/DictTypeList.vue'),
//         meta: {
//           title: '字典类型',
//         },
//       },
//       {
//         path: 'item',
//         name: 'DictItem',
//         component: () => import('./dict/item/DictItemList.vue'),
//         meta: {
//           title: '字典数据',
//         },
//       },
//     ],
//   },
//   {
//     path: '/crawler',
//     name: 'Crawler',
//     component: () => import('./crawler/index.vue'),
//     meta: {
//       title: '爬虫管理',
//       icon: 'connection',
//     },
//     children: [
//       {
//         path: 'picture',
//         name: 'PictureCrawler',
//         component: () => import('./crawler/PictureCrawler.vue'),
//         meta: {
//           title: '图片采集',
//         },
//       },
//     ],
//   },
// ];

// export default routes;
