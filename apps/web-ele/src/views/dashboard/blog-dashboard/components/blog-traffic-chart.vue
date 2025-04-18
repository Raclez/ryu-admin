<script lang="ts" setup>
import {ref} from 'vue';

// 生成模拟数据，过去7天每天的访问量
const trafficData = ref([
  {date: '周一', pageViews: 2310, visitors: 1240, avgTime: 145},
  {date: '周二', pageViews: 2580, visitors: 1530, avgTime: 132},
  {date: '周三', pageViews: 3490, visitors: 1890, avgTime: 164},
  {date: '周四', pageViews: 3120, visitors: 1750, avgTime: 153},
  {date: '周五', pageViews: 2890, visitors: 1680, avgTime: 142},
  {date: '周六', pageViews: 4120, visitors: 2250, avgTime: 175},
  {date: '周日', pageViews: 3860, visitors: 2100, avgTime: 168},
]);

// 计算每日访问量占比
const totalPageViews = trafficData.value.reduce((sum, item) => sum + item.pageViews, 0);
const percentages = trafficData.value.map(item => ({
  ...item,
  percentage: Math.round((item.pageViews / totalPageViews) * 100)
}));

// 计算总计
const totals = {
  pageViews: totalPageViews,
  visitors: trafficData.value.reduce((sum, item) => sum + item.visitors, 0),
  avgTime: Math.round(
    trafficData.value.reduce((sum, item) => sum + item.avgTime, 0) / trafficData.value.length
  )
};
</script>

<template>
  <div class="traffic-chart">
    <!-- 流量统计汇总信息 -->
    <div class="mb-4 grid grid-cols-3 gap-4">
      <div class="rounded-md bg-blue-50 p-4 dark:bg-blue-900">
        <div class="text-sm text-gray-500 dark:text-gray-400">总访问量</div>
        <div class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{
            totals.pageViews
          }}
        </div>
      </div>
      <div class="rounded-md bg-green-50 p-4 dark:bg-green-900">
        <div class="text-sm text-gray-500 dark:text-gray-400">总访客数</div>
        <div class="text-2xl font-bold text-green-700 dark:text-green-300">{{
            totals.visitors
          }}
        </div>
      </div>
      <div class="rounded-md bg-orange-50 p-4 dark:bg-orange-900">
        <div class="text-sm text-gray-500 dark:text-gray-400">平均停留时间</div>
        <div class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{
            totals.avgTime
          }}秒
        </div>
      </div>
    </div>

    <!-- 每日数据表格 -->
    <div class="mt-4 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
      <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
        <tr>
          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            日期
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            访问量
          </th>
          <th
            class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
            访客数
          </th>
          <th
            class="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 md:table-cell">
            平均停留时间
          </th>
          <th
            class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            占比
          </th>
        </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
        <tr v-for="item in percentages" :key="item.date"
            class="hover:bg-gray-50 dark:hover:bg-gray-800">
          <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
            {{ item.date }}
          </td>
          <td class="whitespace-nowrap px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
            {{ item.pageViews }}
          </td>
          <td
            class="hidden whitespace-nowrap px-4 py-2 text-sm text-gray-900 dark:text-gray-100 md:table-cell">
            {{ item.visitors }}
          </td>
          <td
            class="hidden whitespace-nowrap px-4 py-2 text-sm text-gray-900 dark:text-gray-100 md:table-cell">
            {{ item.avgTime }}秒
          </td>
          <td class="whitespace-nowrap px-4 py-2 text-sm">
            <div class="flex items-center">
              <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  :style="{ width: `${item.percentage}%` }"
                  class="h-2 rounded-full bg-blue-500"
                ></div>
              </div>
              <span class="ml-2 min-w-[40px] text-xs text-gray-600 dark:text-gray-400">{{
                  item.percentage
                }}%</span>
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 流量来源简要分析 -->
    <div class="mt-4 rounded-md border border-gray-200 p-4 dark:border-gray-700">
      <h3 class="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">流量来源分析</h3>
      <div class="flex flex-wrap gap-2">
        <div
          class="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          搜索引擎 48%
        </div>
        <div
          class="rounded-full bg-green-100 px-3 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
          直接访问 22%
        </div>
        <div
          class="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          社交媒体 18%
        </div>
        <div
          class="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800 dark:bg-purple-900 dark:text-purple-200">
          外部链接 12%
        </div>
      </div>
    </div>
  </div>
</template>
