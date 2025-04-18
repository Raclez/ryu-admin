import type {RouteRecordRaw} from "vue-router";
import {Crop, Picture} from "@element-plus/icons-vue";

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: Crop,
      keepAlive: true,
      order: 1003,
      title: '爬虫管理',
    },
    name: 'CrawlerManagement',
    path: '/crawler',
    children: [
      {
        meta: {
          title: '图片采集',
          icon: Picture,
        },
        name: 'PictureCrawler',
        path: '/crawler/picture',
        component: () => import('#/views/features/crawler/PictureCrawler.vue'),
      },
    ],
  },
];

export default routes;
