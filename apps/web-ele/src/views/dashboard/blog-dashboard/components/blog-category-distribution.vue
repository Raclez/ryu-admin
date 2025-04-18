<script lang="ts" setup>
import {computed} from 'vue';

// 模拟分类数据
const categories = [
  {name: '前端开发', count: 145, color: '#409EFF'},
  {name: '后端技术', count: 89, color: '#67C23A'},
  {name: '开发工具', count: 56, color: '#E6A23C'},
  {name: '数据库', count: 48, color: '#F56C6C'},
  {name: '架构设计', count: 42, color: '#909399'},
  {name: '云原生', count: 38, color: '#9C27B0'},
  {name: '其他技术', count: 32, color: '#FF9800'},
];

// 计算总数和百分比
const total = categories.reduce((sum, cat) => sum + cat.count, 0);
const categoriesWithPercent = computed(() =>
  categories.map(cat => ({
    ...cat,
    percent: Math.round((cat.count / total) * 100)
  }))
);

// 按数量排序
const sortedCategories = computed(() =>
  [...categoriesWithPercent.value].sort((a, b) => b.count - a.count)
);
</script>

<template>
  <div class="category-distribution">
    <!-- 环形图用进度条模拟 -->
    <div class="grid grid-cols-1 gap-2">
      <div
        v-for="category in sortedCategories"
        :key="category.name"
        class="progress-item"
      >
        <div class="mb-1 flex items-center justify-between">
          <div class="flex items-center">
            <div
              :style="{ backgroundColor: category.color }"
              class="mr-2 h-3 w-3 rounded-full"
            ></div>
            <span class="text-sm font-medium">{{ category.name }}</span>
          </div>
          <div class="text-sm text-gray-500">
            {{ category.count }} ({{ category.percent }}%)
          </div>
        </div>
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            :style="{
              width: `${category.percent}%`,
              backgroundColor: category.color
            }"
            class="h-2 rounded-full"
          ></div>
        </div>
      </div>
    </div>

    <!-- 分类统计信息 -->
    <div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
      <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-800">
        <div class="text-lg font-bold">{{ total }}</div>
        <div class="text-xs text-gray-500">文章总数</div>
      </div>
      <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-800">
        <div class="text-lg font-bold">{{ categories.length }}</div>
        <div class="text-xs text-gray-500">分类总数</div>
      </div>
      <div class="rounded-md bg-gray-50 p-3 text-center dark:bg-gray-800">
        <div class="text-lg font-bold">{{ Math.round(total / categories.length) }}</div>
        <div class="text-xs text-gray-500">平均文章数</div>
      </div>
    </div>
  </div>
</template>
