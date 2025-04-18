import type {RouteRecordRaw} from "vue-router";
import {Tools, Notebook, Setting, Operation, Warning} from '@element-plus/icons-vue'

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Tools,
      keepAlive: true,
      order: 500,
      title: '系统管理',
    },
    name: 'SystemManagement',
    path: '/system-management',
    children: [
      {
        meta: {
          title: '字典管理',
          icon: Notebook,
        },
        name: 'Dict',
        path: '/dict',
        children: [
          {
            meta: {
              title: '字典类型',
              icon: Notebook,
            },
            name: 'DictType',
            path: '/dict/type',
            component: () => import('#/views/features/dict/type/DictTypeList.vue'),
          },
          {
            meta: {
              title: '字典数据',
              icon: Operation,
            },
            name: 'DictItem',
            path: '/dict/item',
            component: () => import('#/views/features/dict/item/DictItemList.vue'),
          },
        ],
      },
      {
        meta: {
          title: '系统配置',
          icon: Setting,
        },
        name: 'SystemConfig',
        path: '/system-config/form',
        component: () => import('#/views/features/system-config/SystemConfigForm.vue'),
      },
      {
        meta: {
          title: '系统监控',
          icon: Warning,
        },
        name: 'SystemMonitor',
        path: '/system/monitor',
        component: () => import('#/views/features/system/SystemLog.vue'),
      },
    ],
  },
];

export default routes;
