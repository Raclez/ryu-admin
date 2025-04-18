<script lang="ts" setup>
import {ref, computed} from 'vue';

// 模拟互动数据
const engagementData = ref([
  {
    name: '评论数',
    monthly: [45, 52, 38, 65, 72, 58, 80, 95, 110, 125, 142, 154],
    total: 1036,
    growth: 24.5,
    color: '#409EFF'
  },
  {
    name: '点赞数',
    monthly: [125, 145, 160, 185, 210, 195, 240, 265, 280, 310, 345, 380],
    total: 2840,
    growth: 42.8,
    color: '#67C23A'
  },
  {
    name: '分享数',
    monthly: [28, 32, 35, 40, 45, 42, 50, 55, 62, 70, 78, 85],
    total: 622,
    growth: 37.2,
    color: '#E6A23C'
  },
  {
    name: '收藏数',
    monthly: [60, 75, 85, 95, 110, 105, 125, 140, 155, 170, 190, 210],
    total: 1520,
    growth: 31.9,
    color: '#F56C6C'
  }
]);

// 月份标签
const monthLabels = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

// 计算总互动量和加权平均增长率
const stats = computed(() => {
  const totalEngagements = engagementData.value.reduce((sum, item) => sum + item.total, 0);
  const weightedGrowth = engagementData.value.reduce((sum, item) => sum + (item.growth * item.total), 0) / totalEngagements;

  return {
    totalEngagements,
    weightedGrowth
  };
});

// 计算每月总互动量
const monthlyTotals = computed(() => {
  return monthLabels.map((_, index) => {
    return engagementData.value.reduce((sum, item) => sum + item.monthly[index], 0);
  });
});
</script>

<template>
  <div class="engagement-chart">
    <!-- 互动概览卡片 -->
    <div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      <div
        v-for="item in engagementData"
        :key="item.name"
        :style="{ backgroundColor: `${item.color}20` }"
        class="rounded-md p-3"
      >
        <div class="flex flex-col items-start">
          <div class="text-sm text-gray-500">{{ item.name }}</div>
          <div :style="{ color: item.color }" class="text-2xl font-bold">{{ item.total }}</div>
          <div
            :class="item.growth > 0 ? 'text-green-600' : 'text-red-600'"
            class="mt-1 flex items-center text-xs"
          >
            <span>{{ item.growth > 0 ? '+' : '' }}{{ item.growth }}%</span>
            <svg
              v-if="item.growth > 0"
              class="ml-1 h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path clip-rule="evenodd"
                    d="M10 5a1 1 0 01.707.293l4 4a1 1 0 01-1.414 1.414L10 7.414 6.707 10.707a1 1 0 01-1.414-1.414l4-4A1 1 0 0110 5z"
                    fill-rule="evenodd"/>
            </svg>
            <svg
              v-else
              class="ml-1 h-3 w-3"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path clip-rule="evenodd"
                    d="M10 15a1 1 0 01-.707-.293l-4-4a1 1 0 011.414-1.414L10 12.586l3.293-3.293a1 1 0 011.414 1.414l-4 4A1 1 0 0110 15z"
                    fill-rule="evenodd"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 互动分析表格 -->
    <div class="mt-4 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              类型
            </th>
            <th
              v-for="(month, index) in monthLabels"
              :key="month"
              :class="index > 5 ? 'hidden xl:table-cell' : 'hidden md:table-cell'"
              class="whitespace-nowrap px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
            >
              {{ month }}
            </th>
            <th
              class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              总计
            </th>
            <th
              class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              增长
            </th>
          </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          <tr
            v-for="item in engagementData"
            :key="item.name"
            class="hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <td class="whitespace-nowrap px-3 py-2">
              <div class="flex items-center">
                <div
                  :style="{ backgroundColor: item.color }"
                  class="mr-2 h-3 w-3 rounded-full"
                ></div>
                <span class="text-sm font-medium">{{ item.name }}</span>
              </div>
            </td>
            <td
              v-for="(value, index) in item.monthly"
              :key="index"
              :class="index > 5 ? 'hidden xl:table-cell' : 'hidden md:table-cell'"
              class="whitespace-nowrap px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400"
            >
              {{ value }}
            </td>
            <td :style="{ color: item.color }"
                class="whitespace-nowrap px-3 py-2 text-center text-sm font-medium">
              {{ item.total }}
            </td>
            <td
              :class="item.growth > 0 ? 'text-green-600' : 'text-red-600'"
              class="whitespace-nowrap px-3 py-2 text-center text-sm font-medium"
            >
              {{ item.growth > 0 ? '+' : '' }}{{ item.growth }}%
            </td>
          </tr>
          <!-- 总计行 -->
          <tr class="bg-gray-50 dark:bg-gray-800">
            <td class="whitespace-nowrap px-3 py-2 text-sm font-medium">总互动量</td>
            <td
              v-for="(total, index) in monthlyTotals"
              :key="index"
              :class="index > 5 ? 'hidden xl:table-cell' : 'hidden md:table-cell'"
              class="whitespace-nowrap px-3 py-2 text-center text-sm font-medium"
            >
              {{ total }}
            </td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm font-medium">
              {{ stats.totalEngagements }}
            </td>
            <td class="whitespace-nowrap px-3 py-2 text-center text-sm font-medium text-green-600">
              +{{ stats.weightedGrowth.toFixed(1) }}%
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 互动详情分析 -->
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="rounded-md border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="mb-2 text-sm font-medium">互动热门文章</h3>
        <div class="space-y-2">
          <div class="flex justify-between rounded-md bg-gray-50 p-2 dark:bg-gray-800">
            <span class="text-sm">Vue3性能优化最佳实践指南</span>
            <span class="text-sm text-gray-500">485次互动</span>
          </div>
          <div class="flex justify-between rounded-md bg-gray-50 p-2 dark:bg-gray-800">
            <span class="text-sm">TypeScript高级类型体操详解</span>
            <span class="text-sm text-gray-500">342次互动</span>
          </div>
          <div class="flex justify-between rounded-md bg-gray-50 p-2 dark:bg-gray-800">
            <span class="text-sm">React Hooks完全指南</span>
            <span class="text-sm text-gray-500">318次互动</span>
          </div>
        </div>
      </div>
      <div class="rounded-md border border-gray-200 p-4 dark:border-gray-700">
        <h3 class="mb-2 text-sm font-medium">互动用户分布</h3>
        <div class="space-y-2">
          <div class="flex items-center">
            <div class="mr-2 h-3 w-3 rounded-full bg-blue-500"></div>
            <span class="text-sm">活跃开发者</span>
            <div class="ml-auto">45%</div>
          </div>
          <div class="flex items-center">
            <div class="mr-2 h-3 w-3 rounded-full bg-green-500"></div>
            <span class="text-sm">技术爱好者</span>
            <div class="ml-auto">28%</div>
          </div>
          <div class="flex items-center">
            <div class="mr-2 h-3 w-3 rounded-full bg-yellow-500"></div>
            <span class="text-sm">学生</span>
            <div class="ml-auto">18%</div>
          </div>
          <div class="flex items-center">
            <div class="mr-2 h-3 w-3 rounded-full bg-red-500"></div>
            <span class="text-sm">其他</span>
            <div class="ml-auto">9%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
