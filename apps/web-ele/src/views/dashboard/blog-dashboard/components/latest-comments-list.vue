<script lang="ts" setup>
import {ref} from 'vue';
import {Check, Close, Edit, Delete} from '@element-plus/icons-vue';

// 定义评论状态类型
type CommentStatus = 'pending' | 'approved' | 'rejected';

// 定义评论类型
interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  date: string;
  postTitle: string;
  status: CommentStatus;
}

// 定义状态映射类型
interface StatusMapType {
  [key: string]: {
    label: string;
    color: string;
  };
}

// 模拟最新评论数据
const latestComments = ref<Comment[]>([
  {
    id: 1,
    author: '张小明',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    content: '这篇文章写得非常清晰，对我理解Vue3的Composition API很有帮助！',
    date: '2小时前',
    postTitle: 'Vue3响应式原理深度解析',
    status: 'pending'
  },
  {
    id: 2,
    author: '李明',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '能否分享一下你使用TypeScript的实际项目经验？文章很棒，但想了解更实际的应用场景。',
    date: '4小时前',
    postTitle: 'TypeScript高级类型体操详解',
    status: 'pending'
  },
  {
    id: 3,
    author: '王华',
    avatar: 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
    content: '这个性能优化技巧我试了一下，确实提升了我的应用速度，感谢分享！',
    date: '昨天',
    postTitle: 'React性能优化实践',
    status: 'approved'
  },
  {
    id: 4,
    author: '赵秀英',
    avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
    content: '请问文章中提到的微服务架构适用于中小型项目吗？我们团队规模不大，不知道是否值得引入这么复杂的架构。',
    date: '前天',
    postTitle: '前端微服务架构演进',
    status: 'pending'
  },
  {
    id: 5,
    author: '刘天',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    content: '文章中有一个错误，Node.js的事件循环机制不是这样工作的，我建议你查阅一下官方文档。',
    date: '3天前',
    postTitle: 'Node.js性能调优与监控',
    status: 'rejected'
  }
]);

// 评论状态映射
const statusMap: StatusMapType = {
  pending: {
    label: '待审核',
    color: '#E6A23C'
  },
  approved: {
    label: '已通过',
    color: '#67C23A'
  },
  rejected: {
    label: '已拒绝',
    color: '#F56C6C'
  }
};

// 处理评论操作
const handleApprove = (id: number) => {
  const comment = latestComments.value.find(item => item.id === id);
  if (comment) {
    comment.status = 'approved';
  }
};

const handleReject = (id: number) => {
  const comment = latestComments.value.find(item => item.id === id);
  if (comment) {
    comment.status = 'rejected';
  }
};

const handleReply = (id: number) => {
  console.log('回复评论:', id);
  // 这里可以实现回复评论的逻辑
};

const handleDelete = (id: number) => {
  const index = latestComments.value.findIndex(item => item.id === id);
  if (index !== -1) {
    latestComments.value.splice(index, 1);
  }
};
</script>

<template>
  <div class="comments-list">
    <div v-if="latestComments.length === 0" class="text-center py-4 text-gray-500">
      暂无评论数据
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="comment in latestComments"
        :key="comment.id"
        class="comment-item rounded-md border border-gray-100 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
      >
        <div class="flex items-start">
          <!-- 头像 -->
          <div class="mr-3">
            <img
              :src="comment.avatar"
              alt="用户头像"
              class="h-10 w-10 rounded-full object-cover"
            />
          </div>

          <!-- 评论内容 -->
          <div class="flex-grow">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <span class="font-medium">{{ comment.author }}</span>
                <span class="ml-2 text-xs text-gray-500">{{ comment.date }}</span>
              </div>
              <div
                :style="{ backgroundColor: `${statusMap[comment.status].color}20`, color: statusMap[comment.status].color }"
                class="text-xs rounded-full px-2 py-0.5"
              >
                {{ statusMap[comment.status].label }}
              </div>
            </div>

            <div class="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {{ comment.content }}
            </div>

            <div class="mt-1 text-xs text-gray-500">
              评论于: {{ comment.postTitle }}
            </div>

            <!-- 操作按钮 -->
            <div class="mt-2 flex justify-end space-x-2">
              <template v-if="comment.status === 'pending'">
                <el-button
                  :icon="Check"
                  circle
                  size="small"
                  type="success"
                  @click="handleApprove(comment.id)"
                />
                <el-button
                  :icon="Close"
                  circle
                  size="small"
                  type="danger"
                  @click="handleReject(comment.id)"
                />
              </template>
              <el-button
                :icon="Edit"
                circle
                size="small"
                type="primary"
                @click="handleReply(comment.id)"
              />
              <el-button
                :icon="Delete"
                circle
                size="small"
                type="danger"
                @click="handleDelete(comment.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 查看更多按钮 -->
    <div class="mt-4 text-center">
      <el-button plain type="primary">查看全部评论</el-button>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  transition: all 0.3s ease;
}
</style>
