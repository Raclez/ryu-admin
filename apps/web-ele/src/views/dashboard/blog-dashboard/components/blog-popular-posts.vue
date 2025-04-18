<script lang="ts" setup>
import {defineProps, defineEmits} from 'vue';
import {View, Comment, Star, Edit} from '@element-plus/icons-vue';

// 定义博客文章类型
export interface BlogPost {
  id: number;
  title: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  category?: string;
  views: number;
  comments: number;
  likes?: number;
  date?: string;
}

// 定义属性
const props = defineProps({
  posts: {
    type: Array as () => BlogPost[],
    default: () => [],
  },
});

// 定义事件
const emit = defineEmits(['view', 'edit']);

// 简化内容
const truncateText = (text: string | undefined, length: number = 60): string => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// 处理查看文章
const handleView = (id: number) => {
  emit('view', id);
};

// 处理编辑文章
const handleEdit = (id: number) => {
  emit('edit', id);
};
</script>

<template>
  <div class="popular-posts-component">
    <div class="popular-posts-list space-y-3">
      <div
        v-for="post in props.posts"
        :key="post.id"
        class="post-item flex rounded-md border border-gray-100 overflow-hidden transition-all hover:shadow-md dark:border-gray-700"
      >
        <!-- 文章图片 -->
        <div class="post-image w-1/4 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <img
            :alt="post.title"
            :src="post.coverImage || 'https://via.placeholder.com/300x200?text=封面'"
            class="h-full w-full object-cover"
          />
        </div>

        <!-- 文章内容 -->
        <div class="post-content flex w-3/4 flex-col justify-between p-3">
          <div>
            <h3 class="post-title mb-1 text-sm font-medium line-clamp-1">{{ post.title }}</h3>
            <p v-if="post.excerpt || post.content"
               class="post-excerpt text-xs text-gray-500 line-clamp-2">
              {{ truncateText(post.excerpt || post.content) }}
            </p>
          </div>

          <!-- 文章统计信息 -->
          <div class="post-meta mt-2 flex items-center justify-between">
            <div class="stats flex items-center space-x-3 text-xs text-gray-500">
              <span v-if="post.category" class="category-badge">
                <el-tag size="small" type="info">{{ post.category }}</el-tag>
              </span>
              <span class="flex items-center">
                <el-icon class="mr-1"><View/></el-icon>{{ post.views }}
              </span>
              <span class="flex items-center">
                <el-icon class="mr-1"><Comment/></el-icon>{{ post.comments }}
              </span>
              <span v-if="post.likes !== undefined" class="flex items-center">
                <el-icon class="mr-1"><Star/></el-icon>{{ post.likes }}
              </span>
            </div>
            <div class="actions">
              <el-button-group>
                <el-button :icon="View" size="small" type="primary" @click="handleView(post.id)"/>
                <el-button :icon="Edit" size="small" type="success" @click="handleEdit(post.id)"/>
              </el-button-group>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="props.posts.length === 0" class="empty-state py-4 text-center text-gray-500">
        暂无热门文章
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-item {
  transition: all 0.3s ease;
}

.post-item:hover {
  transform: translateY(-2px);
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
