import type {RouteRecordRaw} from "vue-router";
import {Crop, Female, Picture} from "@element-plus/icons-vue";


const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Female,
      keepAlive: true,
      order: 1020,
      title: '监控管理',
    },
    name: 'SysMonitor',
    path: '/monitor',
    children: [
      {
        meta: {
          title: '资源监控',
          icon: Crop,
        },
        name: 'cc',
        path: '/monitor/sys',
        component: () => import('#/views/demos/system/index.vue'),
      },
    ],
  },
];

export default routes;
