import type {RouteRecordRaw} from "vue-router";
import {Tools, Notebook, Setting, Operation} from '@element-plus/icons-vue'
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Tools,
      keepAlive: true,
      order: 500,
      title: '系统管理',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        meta: {
          title: '字典类型管理',
          icon: Notebook,
        },
        name: 'DictType',
        path: '/sysDictType/page',
        component: () => import('#/views/demos/dictType/index.vue'),
      },
      {
        meta: {
          title: '字典项管理',
          icon: Operation
        },
        name: 'DictItem',
        path: '/sysDictItem/page',
        component: () => import('#/views/demos/dictItem/index.vue'),
      },
      {
        meta: {
          title: '系统配置',
          icon: Setting,
        },
        name: 'SystemConfig',
        path: '/sysConfig/getSysConfig',
        component: () => import('#/views/demos/systemConfig/index.vue'),
      }


    ],
  },
];

export default routes;
