<script lang="ts" setup>
import {defineProps, defineEmits} from 'vue';
import dayjs from 'dayjs';

// 定义预定发布文章类型
export interface ScheduledPost {
  id: number;
  title: string;
  excerpt?: string;
  scheduledPublishDate: string;
  completionPercentage: number;
  status: string;
}

// 定义属性
const props = defineProps({
  scheduledPosts: {
    type: Array as () => ScheduledPost[],
    default: () => [],
  },
});

// 定义事件
const emit = defineEmits(['continueEditing']);

// 格式化日期
const formatDate = (date: string): string => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '未设置';
};

// 计算进度百分比
const calculateProgress = (post: ScheduledPost): number => {
  return post.completionPercentage || 0;
};

// 获取进度条颜色
const getProgressColor = (percentage: number): string => {
  if (percentage < 30) return 'bg-red-500';
  if (percentage < 70) return 'bg-yellow-500';
  return 'bg-green-500';
};
</script>

<template>
  <div class="scheduled-posts-component">
    <div class="scheduled-posts-list space-y-4">
      <div
        v-for="post in props.scheduledPosts"
        :key="post.id"
        class="scheduled-post border border-gray-100 rounded-md p-4 transition-all hover:shadow-md dark:border-gray-700"
      >
        <div class="flex justify-between items-center mb-2">
          <h3 class="post-title text-sm font-medium">{{ post.title }}</h3>
          <span class="publish-date text-xs text-gray-500">
            发布时间: {{ formatDate(post.scheduledPublishDate) }}
          </span>
        </div>

        <!-- 进度条 -->
        <div
          class="progress-bar-container w-full h-2 bg-gray-200 rounded-full mb-3 dark:bg-gray-700">
          <div
            :class="getProgressColor(calculateProgress(post))"
            :style="`width: ${calculateProgress(post)}%`"
            class="progress-bar h-full rounded-full"
          ></div>
        </div>

        <div class="flex justify-between items-center">
          <span class="completion-status text-xs">
            完成度: {{ calculateProgress(post) }}%
          </span>
          <button
            class="continue-editing-btn px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-deep transition-colors"
            @click="$emit('continueEditing', post.id)"
          >
            继续编辑
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="props.scheduledPosts.length === 0"
           class="empty-state py-4 text-center text-gray-500">
        暂无计划发布的文章
      </div>
    </div>
  </div>
</template>

<style scoped>
.scheduled-post {
  transition: all 0.3s ease;
}
</style>
