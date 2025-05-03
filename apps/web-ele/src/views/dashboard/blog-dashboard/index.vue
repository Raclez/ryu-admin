<script lang="ts" setup>
import type {AnalysisOverviewItem} from '@vben/common-ui';
import type {TabOption} from '@vben/types';
import type {WorkbenchQuickNavItem} from '@vben/common-ui';

import {ref, onMounted, computed} from 'vue';
import {useRouter} from 'vue-router';
import dayjs from 'dayjs';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
  WorkbenchHeader,
  WorkbenchQuickNav,
} from '@vben/common-ui';
import {preferences} from '@vben/preferences';
import {useUserStore} from '@vben/stores';
import {openWindow} from '@vben/utils';

// 导入图标
import {
  Document,
  Edit,
  Picture,
  Reading,
  View,
  Comment,
  Download,
  Ticket,
  Collection,
  Star,
  Clock,
  Calendar,
  Bell,
  CircleCheck,
  Delete,
  Plus,
  Promotion,
  Share,
  Warning,
  Lightning,
  PieChart,
  DataAnalysis,
  Histogram,
  TrendCharts,
  ChatLineRound,
  Monitor,
  Position,
  OfficeBuilding,
  Stamp,
  UserFilled
} from '@element-plus/icons-vue';

// 导入图表组件
import AnalyticsTrends from '../analytics/analytics-trends.vue';
import AnalyticsVisits from '../analytics/analytics-visits.vue';

// 导入自定义组件
import BlogTodoList from './components/blog-todo-list.vue';
import BlogPopularPosts from './components/blog-popular-posts.vue';
import BlogScheduledPosts from './components/blog-scheduled-posts.vue';

// 从组件导入类型
import type {TodoItem} from './components/blog-todo-list.vue';
import type {BlogPost} from './components/blog-popular-posts.vue';
import type {ScheduledPost} from './components/blog-scheduled-posts.vue';

const userStore = useUserStore();
const router = useRouter();

// 定义数据加载动画
const loadingAnimations = ref(true);

// 获取天气和问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早安';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 17) return '下午好';
  if (hour < 19) return '傍晚好';
  return '晚上好';
});

// 获取今日日期
const today = computed(() => {
  return dayjs().format('YYYY年MM月DD日');
});

// 假数据：博客统计概览
const blogStats: AnalysisOverviewItem[] = [
  {
    icon: Document,
    title: '博客总数',
    totalTitle: '本月发布',
    totalValue: 576,
    value: 28,
  },
  {
    icon: View,
    title: '总访问量',
    totalTitle: '本月访问',
    totalValue: 324659,
    value: 18456,
  },
  {
    icon: Comment,
    title: '总评论数',
    totalTitle: '本月评论',
    totalValue: 8542,
    value: 256,
  },
  {
    icon: Star,
    title: '总收藏数',
    totalTitle: '本月收藏',
    totalValue: 2345,
    value: 125,
  },
];

// 博客图表选项卡
const blogChartTabs: TabOption[] = [
  {
    label: '博客发布趋势',
    value: 'posts',
  },
  {
    label: '博客流量分析',
    value: 'traffic',
  },
];

// 快捷导航项
const quickNavItems: WorkbenchQuickNavItem[] = [
  {
    title: '写文章',
    icon: Edit,
    color: '#67C23A',
    url: '/article/edit',
  },
  {
    title: '博客管理',
    icon: Reading,
    color: '#909399',
    url: '/article/list',
  },
  {
    title: '分类管理',
    icon: Ticket,
    color: '#E6A23C',
    url: '/category/list',
  },
  {
    title: '标签管理',
    icon: Collection,
    color: '#F56C6C',
    url: '/tag/list',
  },
  {
    title: '资源管理',
    icon: Comment,
    color: '#909399',
    url: '/resource/list',
  },
  {
    title: '网盘管理',
    icon: Picture,
    color: '#67C23A',
    url: '/disk/files',
  },
];

// 代办事项
const todoItems = ref<TodoItem[]>([
  {
    id: 1,
    title: '完成"Vue3高级特性"博客草稿',
    description: `计划发布日期：${dayjs().add(2, 'day').format('MM月DD日')}`,
    deadline: dayjs().add(2, 'day').valueOf(),
    priority: 'high',
    completed: false
  },
  {
    id: 2,
    title: '回复读者关于React Hooks的评论',
    description: '3条未回复评论',
    deadline: dayjs().add(1, 'day').valueOf(),
    priority: 'medium',
    completed: false
  },
  {
    id: 3,
    title: '准备技术分享：SSR vs CSR vs ISR',
    description: '下周二技术分享会',
    deadline: dayjs().add(5, 'day').valueOf(),
    priority: 'medium',
    completed: false
  },
  {
    id: 4,
    title: '更新"TypeScript类型体操"系列文章',
    description: '需要补充高级类型示例',
    deadline: dayjs().add(3, 'day').valueOf(),
    priority: 'low',
    completed: true
  },
]);

// 新增代办事项
const newTodoTitle = ref('');
const newTodoPriority = ref<'high' | 'medium' | 'low'>('medium');
const newTodoDeadline = ref<number>(dayjs().add(3, 'day').valueOf());
const priorityOptions = [
  {value: 'high', label: '高'},
  {value: 'medium', label: '中'},
  {value: 'low', label: '低'}
];

// 添加新待办事项
const addTodo = (todoData: { title: string; priority: 'high' | 'medium' | 'low' }) => {
  const newTask: TodoItem = {
    id: Date.now(),
    title: todoData.title,
    description: '',
    deadline: newTodoDeadline.value || dayjs().add(3, 'day').valueOf(),
    priority: todoData.priority,
    completed: false
  };

  todoItems.value.unshift(newTask);

  // 清空输入框
  newTodoTitle.value = '';
  newTodoDeadline.value = dayjs().add(3, 'day').valueOf();
};

// 添加新任务的包装方法
const addNewTodo = () => {
  if (newTodoTitle.value.trim()) {
    addTodo({
      title: newTodoTitle.value,
      priority: newTodoPriority.value
    });
  }
};

// 切换任务完成状态
const toggleTodoComplete = (id: number) => {
  const task = todoItems.value.find((item: TodoItem) => item.id === id);
  if (task) {
    task.completed = !task.completed;
  }
};

// 删除待办事项
const deleteTodo = (id: number) => {
  todoItems.value = todoItems.value.filter((item: TodoItem) => item.id !== id);
};

// 获取优先级颜色
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return '#F56C6C';
    case 'medium':
      return '#E6A23C';
    case 'low':
      return '#67C23A';
    default:
      return '#909399';
  }
};

// 获取优先级标签
const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
    default:
      return '默认';
  }
};

// 格式化日期
const formatDate = (timestamp: number) => {
  const date = dayjs(timestamp);
  const now = dayjs();

  if (date.isSame(now, 'day')) {
    return '今天';
  } else if (date.isSame(now.add(1, 'day'), 'day')) {
    return '明天';
  } else if (date.isSame(now.add(2, 'day'), 'day')) {
    return '后天';
  } else {
    return date.format('MM月DD日');
  }
};

// 获取距离截止日期的文本
const getDeadlineText = (timestamp: number) => {
  const date = dayjs(timestamp);
  const now = dayjs();
  const diff = date.diff(now, 'day');

  if (diff < 0) {
    return '已逾期';
  } else if (diff === 0) {
    return '今天截止';
  } else if (diff === 1) {
    return '明天截止';
  } else if (diff <= 3) {
    return `${diff}天后截止`;
  } else {
    return date.format('MM月DD日截止');
  }
};

// 获取近期热门文章
const popularPosts = ref<BlogPost[]>([
  {
    id: 1,
    title: 'Vue3性能优化最佳实践指南',
    content: '本文详细介绍了Vue3应用性能优化的多种方法，包括响应式数据优化、组件设计、渲染策略等方面的最佳实践。',
    excerpt: '本文详细介绍了Vue3应用性能优化的多种方法，包括响应式数据优化、组件设计、渲染策略等方面的最佳实践。',
    views: 4231,
    comments: 56,
    likes: 128,
    category: 'Vue.js',
    coverImage: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
    date: '2023-06-15',
  },
  {
    id: 2,
    title: 'TypeScript高级类型体操详解',
    content: '深入探讨TypeScript的高级类型系统，包括条件类型、映射类型、递归类型等进阶用法，帮助你掌握类型编程技巧。',
    excerpt: '深入探讨TypeScript的高级类型系统，包括条件类型、映射类型、递归类型等进阶用法，帮助你掌握类型编程技巧。',
    views: 3245,
    comments: 42,
    likes: 87,
    category: 'TypeScript',
    coverImage: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    date: '2023-07-22',
  },
  {
    id: 3,
    title: 'React Hooks完全指南',
    content: '全面讲解React Hooks的使用方法和最佳实践，从基础到高级，帮助你充分利用函数式组件的强大功能。',
    excerpt: '全面讲解React Hooks的使用方法和最佳实践，从基础到高级，帮助你充分利用函数式组件的强大功能。',
    views: 2987,
    comments: 38,
    likes: 76,
    category: 'React',
    coverImage: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    date: '2023-08-05',
  },
  {
    id: 4,
    title: '前端微服务架构演进',
    content: '分享前端微服务架构的实践经验，从单体应用到微前端的演进过程，以及各种技术选型和集成策略的比较。',
    excerpt: '分享前端微服务架构的实践经验，从单体应用到微前端的演进过程，以及各种技术选型和集成策略的比较。',
    views: 2456,
    comments: 24,
    likes: 55,
    category: '架构',
    coverImage: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    date: '2023-08-18',
  },
]);

// 预定发布的文章
const scheduledPosts = ref<ScheduledPost[]>([
  {
    id: 101,
    title: 'WebAssembly实战：提升Web应用性能',
    excerpt: '探索如何将WebAssembly集成到现代Web应用中，通过实例展示其在性能密集型场景的优势。',
    scheduledPublishDate: dayjs().add(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
    status: 'scheduled',
    completionPercentage: 85,
  },
  {
    id: 102,
    title: '深入浅出HTTP/3与QUIC协议',
    excerpt: '详细解读HTTP/3和QUIC协议的工作原理、关键特性及其对Web性能的影响，并提供实际应用示例。',
    scheduledPublishDate: dayjs().add(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
    status: 'scheduled',
    completionPercentage: 60,
  },
  {
    id: 103,
    title: 'CSS容器查询与层叠上下文详解',
    excerpt: '深入剖析CSS容器查询的使用技巧和层叠上下文的工作机制，帮助你构建更灵活的响应式布局。',
    scheduledPublishDate: dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss'),
    status: 'scheduled',
    completionPercentage: 40,
  },
]);

// 最近动态
const recentActivities = ref([
  {
    id: 1,
    type: 'comment',
    content: '有读者在《深入理解Vue3响应式原理》发表了评论',
    time: '2小时前',
    icon: Comment,
    color: '#67C23A'
  },
  {
    id: 2,
    type: 'like',
    content: '您的文章《React性能优化实践》获得了32个赞',
    time: '昨天',
    icon: Star,
    color: '#E6A23C'
  },
  {
    id: 3,
    type: 'feature',
    content: '您的博客被推荐到首页热门文章',
    time: '3天前',
    icon: Promotion,
    color: '#F56C6C'
  },
  {
    id: 4,
    type: 'backup',
    content: '系统已自动备份您的所有博客内容',
    time: '1周前',
    icon: Download,
    color: '#909399'
  }
]);

// 博客分类占比数据
const categoryData = [
  {name: 'Vue.js', value: 42, color: '#42b883'},
  {name: 'React', value: 28, color: '#61dafb'},
  {name: 'TypeScript', value: 18, color: '#3178c6'},
  {name: '架构', value: 8, color: '#f9ae3e'},
  {name: '其他', value: 4, color: '#909399'}
];

// 阅读量来源数据
const trafficSourceData = [
  {name: '搜索引擎', value: 52, color: '#67C23A'},
  {name: '社交媒体', value: 28, color: '#E6A23C'},
  {name: '直接访问', value: 12, color: '#F56C6C'},
  {name: '外部链接', value: 8, color: '#909399'}
];

// 目标与完成情况数据
const goalData = {
  blogCount: {current: 28, target: 30, percentage: 93},
  viewCount: {current: 18456, target: 20000, percentage: 92},
  commentCount: {current: 256, target: 300, percentage: 85}
};

// 阅读时间分布
const readTimeData = [
  {time: '早上 (6-9点)', percentage: 15},
  {time: '上午 (9-12点)', percentage: 25},
  {time: '下午 (12-18点)', percentage: 40},
  {time: '晚上 (18-24点)', percentage: 20}
];

// SEO数据
const seoData = {
  organicTraffic: 4260,
  backlinks: 127,
  averageRank: 8.4,
  impressions: 12540,
  clicks: 2340
};

// 热门关键词
const topKeywords = [
  {word: 'Vue 3 教程', rank: 2, volume: 4800, change: 3},
  {word: 'TypeScript 高级教程', rank: 5, volume: 3200, change: -1},
  {word: 'React Hooks 使用', rank: 3, volume: 2800, change: 2},
  {word: '前端微服务架构', rank: 7, volume: 1900, change: 5}
];

// 读者用户画像
const readerProfile = {
  region: {
    '北京': 25,
    '上海': 30,
    '广州': 18,
    '成都': 15,
    '其他': 12
  },
  device: {'桌面': 58, '移动': 42},
  visitSource: {
    '搜索引擎': 45,
    '直接访问': 25,
    '第三方': 15,
    '客户端': 10,
    'ipad': 5
  }
};

// 格式化数字，添加千位分隔符
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('zh-CN').format(num);
};

/**
 * 导航到特定路由
 * @param item 导航项
 */
const navTo = (item: WorkbenchQuickNavItem) => {
  if (item.url && item.url.startsWith('http')) {
    openWindow(item.url);
  } else if (item.url) {
    router.push(item.url);
  }
};

/**
 * 编辑文章
 * @param id 文章ID
 */
const editPost = (id: number | string) => {
  router.push(`/article/edit/${id}`);
};

/**
 * 查看文章
 * @param id 文章ID
 */
const viewPost = (id: number | string) => {
  // 由于当前没有专门的预览页面，暂时跳转到编辑页面
  router.push(`/article/edit/${id}`);
};

// 生命周期钩子
onMounted(() => {
  // 这里可以加载实际数据
  setTimeout(() => {
    loadingAnimations.value = false;
  }, 800);
});

// 导航到写文章页面
function goToWriteArticle() {
  router.push('/article/edit');
}

// 导航到文章管理页面
function goToManageArticles() {
  router.push('/article/list');
}

// 导航到文章列表页面
function goToPostsPage() {
  router.push('/article/list');
}

// 编辑任务
const editTodo = (todo: TodoItem) => {
  // 这里可以实现编辑功能，例如打开编辑对话框
  console.log('编辑任务:', todo);
};
</script>

<template>
  <!-- 页面容器 -->
  <div>
    <!-- 加载动画遮罩 -->
    <div v-if="loadingAnimations"
         class="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
      <div class="loading-spinner"></div>
    </div>

    <!-- 主内容区域 -->
    <div :class="{'opacity-0': loadingAnimations, 'opacity-100': !loadingAnimations}"
         class="transition-opacity duration-500">
  <div class="dashboard p-4">
    <!-- 个人欢迎区域 - 现代化设计 -->
    <div
      class="welcome-card mb-6 relative overflow-hidden rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
      <!-- 背景图案 -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
        <div class="absolute inset-0 opacity-10">
          <svg class="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="wave-pattern" height="100" patternTransform="scale(2) rotate(0)" patternUnits="userSpaceOnUse"
                       width="100">
                <path d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 90C27.9 90 10 72.1 10 50C10 27.9 27.9 10 50 10C72.1 10 90 27.9 90 50C90 72.1 72.1 90 50 90Z"
                      fill="rgba(100, 100, 255, 0.1)"/>
              </pattern>
            </defs>
            <rect fill="url(#wave-pattern)" height="100%" width="100%" x="0" y="0"/>
          </svg>
        </div>
      </div>

      <!-- 内容区域 -->
      <div
        class="relative p-6 flex flex-col md:flex-row items-center md:items-start justify-between">
        <!-- 左侧欢迎信息 -->
        <div class="flex items-center md:max-w-3xl">
          <div class="mr-5 relative">
            <div
              class="avatar-ring absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 animate-pulse"></div>
            <el-avatar
              :size="90"
              :src="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
              class="border-4 border-white dark:border-gray-800 shadow-md"
            />
          </div>
        <div class="ml-4">
          <h1
            class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {{ greeting }}，{{ userStore.userInfo?.realName }}
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {{ today }}
          </p>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            欢迎回到您的博客管理中心，今天准备创作什么内容呢？
          </p>

          <!-- 快捷按钮 -->
          <div class="mt-5 flex space-x-4">
            <div class="action-button flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px] cursor-pointer"
                 @click="goToWriteArticle">
              <el-icon :size="18" class="mr-2">
                <Edit/>
              </el-icon>
              <span>写文章</span>
            </div>
            <div class="action-button flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-200 font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px] cursor-pointer"
                 @click="goToManageArticles">
              <el-icon :size="18" class="mr-2">
                <Document/>
              </el-icon>
              <span>管理文章</span>
            </div>
          </div>
        </div>
        </div>

        <!-- 右侧统计信息 -->
        <div class="mt-6 md:mt-0 flex space-x-6 self-center">
          <div
            class="stat-card flex flex-col items-center p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div class="text-sm text-gray-500 dark:text-gray-400">今日访问</div>
            <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{
                formatNumber(1284)
              }}
            </div>
            <div class="text-xs text-green-500">↑8.2%</div>
          </div>
          <div
            class="stat-card flex flex-col items-center p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div class="text-sm text-gray-500 dark:text-gray-400">未读评论</div>
            <div class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{
                formatNumber(24)
              }}
            </div>
            <div class="text-xs text-green-500">↑4.5%</div>
          </div>
          <div
            class="stat-card flex flex-col items-center p-4 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm">
            <div class="text-sm text-gray-500 dark:text-gray-400">草稿箱</div>
            <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{
                formatNumber(8)
              }}
            </div>
            <div class="text-xs text-gray-500">待发布</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="(stat, index) in blogStats" :key="index"
             :class="[
                   index === 0 ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20' :
                   index === 1 ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' :
                   index === 2 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20' :
                   'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
                 ]"
             class="stat-overview-card relative overflow-hidden p-5 rounded-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:shadow-md hover:translate-y-[-2px]">
          <!-- 装饰圆圈 -->
          <div :class="[
                     index === 0 ? 'bg-blue-200 dark:bg-blue-600' :
                     index === 1 ? 'bg-green-200 dark:bg-green-600' :
                     index === 2 ? 'bg-yellow-200 dark:bg-yellow-600' :
                     'bg-purple-200 dark:bg-purple-600'
                   ]"
               class="absolute -right-4 -top-4 rounded-full h-20 w-20 opacity-20"></div>

          <!-- 图标 -->
          <div :class="[
                     index === 0 ? 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' :
                     index === 1 ? 'text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900/30' :
                     index === 2 ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30' :
                     'text-purple-500 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
                   ]"
               class="inline-flex p-3 rounded-lg mb-4">
            <el-icon :size="24">
              <component :is="stat.icon"/>
            </el-icon>
          </div>

          <!-- 内容 -->
          <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ stat.title }}</h3>
          <div class="flex items-baseline mt-2">
                <span :class="[
                       index === 0 ? 'text-blue-600 dark:text-blue-400' :
                       index === 1 ? 'text-green-600 dark:text-green-400' :
                       index === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                       'text-purple-600 dark:text-purple-400'
                     ]"
                      class="text-2xl font-bold mr-2">{{ formatNumber(stat.totalValue) }}</span>
            <span class="text-sm text-gray-500 dark:text-gray-400">总计</span>
          </div>

          <!-- 本月数据 -->
          <div class="mt-3 flex items-center">
            <div class="text-sm text-gray-600 dark:text-gray-300">{{ stat.totalTitle }}
              <span :class="[
                         index === 0 ? 'text-blue-600 dark:text-blue-400' :
                         index === 1 ? 'text-green-600 dark:text-green-400' :
                         index === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                         'text-purple-600 dark:text-purple-400'
                       ]"
                    class="font-semibold">{{ formatNumber(stat.value) }}</span>
            </div>
            <div
              class="ml-auto bg-green-100 dark:bg-green-900/30 py-0.5 px-2 rounded-full text-xs text-green-700 dark:text-green-400">
              +{{ Math.floor(Math.random() * 10) + 5 }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <!-- 左侧内容 -->
      <div class="lg:col-span-8">
        <!-- 博客数据图表 -->
        <AnalysisChartsTabs
          :tabs="blogChartTabs"
          class="mb-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
        >
          <template #posts>
            <AnalyticsTrends/>
          </template>
          <template #traffic>
            <AnalyticsVisits/>
          </template>
        </AnalysisChartsTabs>

        <!-- 博客分类统计 -->
        <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <!-- 分类占比 -->
          <div class="apple-card">
            <div class="card-title">
              <el-icon :size="20" class="card-title-icon">
                <PieChart/>
              </el-icon>
              <h2 class="card-title-text">博客分类占比</h2>
            </div>
            <div class="pie-chart-container">
              <!-- 简化的饼图展示 -->
              <div class="flex justify-center">
                <div class="category-pie-chart">
                  <div
                    v-for="(item, index) in categoryData"
                    :key="index"
                    :style="{
                      background: item.color,
                      transform: `rotate(${index * 72}deg)`,
                      clip: 'rect(0, 100px, 100px, 50px)'
                    }"
                    class="pie-segment"
                  ></div>
                </div>
              </div>
              <!-- 图例 -->
              <div class="mt-4 grid grid-cols-2 gap-2">
                <div
                  v-for="(item, index) in categoryData"
                  :key="index"
                  class="flex items-center text-xs"
                >
                  <span
                    :style="{ backgroundColor: item.color }"
                    class="mr-1 inline-block h-3 w-3 rounded-full"
                  ></span>
                  <span>{{ item.name }} ({{ item.value }}%)</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 流量来源 -->
          <div class="apple-card">
            <div class="card-title">
              <el-icon :size="20" class="card-title-icon">
                <DataAnalysis/>
              </el-icon>
              <h2 class="card-title-text">阅读量来源</h2>
            </div>
            <!-- 线条样式的水平条形图 -->
            <div class="mt-4 space-y-4">
              <div v-for="(item, index) in trafficSourceData" :key="index" class="traffic-item">
                <div class="flex justify-between mb-1">
                  <span class="text-sm">{{ item.name }}</span>
                  <span class="text-sm font-semibold">{{ item.value }}%</span>
                </div>
                <div class="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    :style="{ width: `${item.value}%`, backgroundColor: item.color }"
                    class="h-1.5 rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 目标完成情况 -->
        <div class="apple-card mb-4">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <TrendCharts/>
            </el-icon>
            <h2 class="card-title-text">本月目标完成</h2>
          </div>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div v-for="(goal, key) in goalData" :key="key" class="goal-card">
              <div class="text-center">
                <div class="goal-title mb-1">
                  {{ key === 'blogCount' ? '文章数' : key === 'viewCount' ? '阅读量' : '评论数' }}
                </div>
                <div class="goal-progress-ring">
                  <svg height="80" viewBox="0 0 80 80" width="80">
                    <circle
                      cx="40"
                      cy="40"
                      fill="none"
                      r="34"
                      stroke="#e6e6e6"
                      stroke-width="4"
                    />
                    <circle
                      :stroke="goal.percentage >= 90 ? '#67C23A' : goal.percentage >= 70 ? '#E6A23C' : '#F56C6C'"
                      :stroke-dasharray="`${2 * Math.PI * 34 * goal.percentage / 100}, ${2 * Math.PI * 34}`"
                      cx="40"
                      cy="40"
                      fill="none"
                      r="34"
                      stroke-dashoffset="0"
                      stroke-width="4"
                      transform="rotate(-90, 40, 40)"
                    />
                    <text fill="currentColor" font-size="16" text-anchor="middle" x="40" y="44">
                      {{ goal.percentage }}%
                    </text>
                  </svg>
                </div>
                <div class="goal-stats mt-2 text-sm">
                  <span class="font-semibold">{{
                      key === 'viewCount' ? formatNumber(goal.current) : goal.current
                    }}</span> / {{ key === 'viewCount' ? formatNumber(goal.target) : goal.target }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SEO数据概览 -->
        <div class="apple-card mb-4">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <Monitor/>
            </el-icon>
            <h2 class="card-title-text">SEO概览</h2>
          </div>

          <!-- 新设计的SEO数据卡片布局 -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div
              class="seo-data-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 relative overflow-hidden">
              <!-- 装饰元素 -->
              <div
                class="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-blue-200 dark:bg-blue-700 opacity-20"></div>
              <div class="relative">
                <div class="flex justify-between items-center mb-2">
                  <div class="text-sm text-gray-600 dark:text-gray-300">自然流量</div>
                  <div
                    class="text-xs text-green-500 bg-green-50 dark:bg-green-900/20 py-0.5 px-2 rounded-full flex items-center">
                    <span class="mr-0.5">↑8.4%</span>
                  </div>
                </div>
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ formatNumber(seoData.organicTraffic) }}
                </div>
                <div class="flex items-center mt-1">
                  <el-icon :size="14" class="mr-1 text-blue-500">
                    <TrendCharts/>
                  </el-icon>
                  <span class="text-xs text-gray-500">较上月增长 {{
                      Math.floor(seoData.organicTraffic * 0.084)
                    }}</span>
                </div>
              </div>
            </div>

            <div
              class="seo-data-card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-800 relative overflow-hidden">
              <!-- 装饰元素 -->
              <div
                class="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-green-200 dark:bg-green-700 opacity-20"></div>
              <div class="relative">
                <div class="flex justify-between items-center mb-2">
                  <div class="text-sm text-gray-600 dark:text-gray-300">展示次数</div>
                  <div
                    class="text-xs text-green-500 bg-green-50 dark:bg-green-900/20 py-0.5 px-2 rounded-full flex items-center">
                    <span class="mr-0.5">↑11.2%</span>
                  </div>
                </div>
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ formatNumber(seoData.impressions) }}
                </div>
                <div class="flex items-center mt-1">
                  <el-icon :size="14" class="mr-1 text-green-500">
                    <View/>
                  </el-icon>
                  <span class="text-xs text-gray-500">点击率 {{
                      Math.round(seoData.clicks / seoData.impressions * 100)
                    }}%</span>
                </div>
              </div>
          </div>

            <div
              class="seo-data-card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 relative overflow-hidden">
              <!-- 装饰元素 -->
              <div
                class="absolute -right-6 -top-6 w-16 h-16 rounded-full bg-purple-200 dark:bg-purple-700 opacity-20"></div>
              <div class="relative">
                <div class="flex justify-between items-center mb-2">
                  <div class="text-sm text-gray-600 dark:text-gray-300">反向链接</div>
                  <div
                    class="text-xs text-green-500 bg-green-50 dark:bg-green-900/20 py-0.5 px-2 rounded-full flex items-center">
                    <span class="mr-0.5">↑3.2%</span>
                  </div>
                </div>
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {{ formatNumber(seoData.backlinks) }}
                </div>
                <div class="flex items-center mt-1">
                  <el-icon :size="14" class="mr-1 text-purple-500">
                    <Share/>
                  </el-icon>
                  <span class="text-xs text-gray-500">高质量链接 {{
                      Math.round(seoData.backlinks * 0.6)
                    }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门关键词 - 新设计 -->
          <div class="keyword-section">
            <h3 class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 flex items-center">
              <el-icon :size="16" class="mr-1">
                <ChatLineRound/>
              </el-icon>
              热门关键词
            </h3>
            <div class="grid grid-cols-1 gap-2">
              <div v-for="(keyword, index) in topKeywords" :key="index"
                   :class="{
                         'border-blue-500 dark:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10': keyword.rank === 1,
                         'border-indigo-500 dark:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10': keyword.rank === 2,
                         'border-green-500 dark:border-green-400 hover:bg-green-50/30 dark:hover:bg-green-900/10': keyword.rank === 3,
                         'border-gray-300 dark:border-gray-500 hover:bg-gray-50/30 dark:hover:bg-gray-700/20': keyword.rank > 3
                       }"
                   class="keyword-item flex items-center rounded-lg p-3 transition-all hover:shadow-md border-l-4">
                <div
                  :class="{
                           'bg-blue-100/70 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400': keyword.rank === 1,
                           'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400': keyword.rank === 2,
                           'bg-green-100/70 text-green-600 dark:bg-green-900/30 dark:text-green-400': keyword.rank === 3,
                           'bg-gray-100/70 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400': keyword.rank > 3
                         }"
                  class="rank-badge w-8 h-8 flex items-center justify-center rounded-lg mr-3 backdrop-blur-sm">
                  <span class="font-semibold">{{ keyword.rank }}</span>
                </div>
                <div class="flex-grow">
                  <div class="font-medium text-gray-800 dark:text-gray-200">{{ keyword.word }}</div>
                  <div class="flex items-center text-xs text-gray-500 mt-1">
                    <span
                      class="bg-gray-100/60 dark:bg-gray-800/60 rounded-full px-2 py-0.5 backdrop-blur-sm">{{
                        formatNumber(keyword.volume)
                      }} 次/月</span>
                  </div>
                </div>
                <div class="flex items-center">
                  <div
                    :class="{
                             'bg-green-50/70 dark:bg-green-900/20 text-green-600 dark:text-green-400': keyword.change > 0,
                             'bg-red-50/70 dark:bg-red-900/20 text-red-600 dark:text-red-400': keyword.change < 0,
                             'bg-gray-50/70 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400': keyword.change === 0
                           }"
                    class="change-badge flex items-center px-2 py-0.5 rounded-full text-xs ml-3 backdrop-blur-sm">
                    <el-icon :size="14" class="mr-1">
                      <TrendCharts v-if="keyword.change > 0"/>
                      <Warning v-else-if="keyword.change < 0"/>
                      <Position v-else/>
                    </el-icon>
                    <span>{{ keyword.change > 0 ? '+' : '' }}{{ keyword.change }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 热门文章列表 -->
        <div class="apple-card mb-4">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <el-icon :size="20" class="card-title-icon">
                <Document/>
              </el-icon>
              <h2 class="card-title-text">热门文章</h2>
            </div>
            <div class="view-more-btn" @click="goToPostsPage">
              <span
                class="text-sm text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer transition-colors">查看全部</span>
            </div>
          </div>
          <div class="popular-posts-list space-y-3">
            <div
              v-for="post in popularPosts"
              :key="post.id"
              class="post-item flex rounded-xl p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-100 dark:border-gray-700"
            >
              <div class="mr-3 flex-shrink-0">
                <div :class="{
                         'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400': post.id % 4 === 0,
                         'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': post.id % 3 === 0,
                         'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400': post.id % 2 === 0,
                         'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400': post.id % 5 === 0 || post.id % 1 === 0
                       }"
                     class="post-icon-wrapper w-12 h-12 rounded-lg flex items-center justify-center">
                  <el-icon :size="24">
                    <Document v-if="post.id % 4 === 0"/>
                    <Reading v-else-if="post.id % 3 === 0"/>
                    <Edit v-else-if="post.id % 2 === 0"/>
                    <View v-else/>
                  </el-icon>
                </div>
              </div>
              <div class="flex-grow">
                <h3 class="post-title font-medium text-gray-900 dark:text-gray-100">{{
                    post.title
                  }}</h3>
                <div class="mt-1 stats flex items-center space-x-3 text-xs text-gray-500">
                  <span class="flex items-center">
                    <el-icon class="mr-1"><View/></el-icon>{{ formatNumber(post.views) }}
                  </span>
                  <span class="flex items-center">
                    <el-icon class="mr-1"><Comment/></el-icon>{{ post.comments }}
                  </span>
                  <span v-if="post.likes !== undefined" class="flex items-center">
                    <el-icon class="mr-1"><Star/></el-icon>{{ post.likes }}
                  </span>
                </div>
              </div>
              <div class="ml-2 flex items-center">
                <div class="action-btn-group flex space-x-2">
                  <div class="action-btn w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 flex items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
                       @click="viewPost(post.id)">
                    <el-icon :size="16">
                      <View/>
                    </el-icon>
                  </div>
                  <div class="action-btn w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-500 dark:text-green-400 flex items-center justify-center cursor-pointer hover:bg-green-100 dark:hover:bg-green-800/30 transition-colors"
                       @click="editPost(post.id)">
                    <el-icon :size="16">
                      <Edit/>
                    </el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近动态 -->
        <div class="apple-card">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <Bell/>
            </el-icon>
            <h2 class="card-title-text">最近动态</h2>
          </div>
          <div class="recent-activities space-y-3">
            <div
              v-for="activity in recentActivities"
              :key="activity.id"
              class="activity-item flex items-center rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              <div
                :style="{ backgroundColor: `${activity.color}15` }"
                class="mr-3 flex h-10 w-10 items-center justify-center rounded-full"
              >
                <el-icon :size="20" :style="{ color: activity.color }">
                  <component :is="activity.icon"/>
                </el-icon>
              </div>
              <div class="flex-grow">
                <div class="text-sm font-medium">{{ activity.content }}</div>
                <div class="text-xs text-gray-500">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="lg:col-span-4">
        <!-- 快捷操作 -->
        <div class="apple-card mb-4">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <Lightning/>
            </el-icon>
            <h2 class="card-title-text">快捷操作</h2>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="item in quickNavItems"
              :key="item.title"
              :class="`bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 dark:from-gray-800 dark:to-gray-700 border border-${item.color}-200 dark:border-gray-600`"
              class="quick-nav-item cursor-pointer rounded-xl p-3 text-center transition-all hover:shadow-lg dark:border-gray-700 transform hover:scale-105"
              @click="navTo(item)"
            >
              <div :class="`bg-${item.color}-100 dark:bg-gray-700 p-2 rounded-lg inline-flex mb-2`">
                <el-icon :size="24" :style="{ color: item.color }" class="opacity-90">
                <component :is="item.icon"/>
              </el-icon>
              </div>
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                  item.title
                }}
              </div>
            </div>
          </div>
        </div>

        <!-- 读者用户画像 -->
        <div class="apple-card mb-4">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <DataAnalysis/>
            </el-icon>
            <h2 class="card-title-text">访问数据分析</h2>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <!-- 雷达图 - 访问来源 -->
            <div class="col-span-1">
              <h3 class="text-sm font-medium text-gray-500 mb-3 text-center">访问来源</h3>
              <div class="radar-chart-container h-48 relative">
                <svg height="100%" viewBox="0 0 200 200" width="100%">
                  <!-- 雷达图背景 -->
                  <polygon fill="none"
                           points="100,10 180,75 150,170 50,170 20,75"
                           stroke="rgba(180,180,180,0.3)"
                           stroke-width="1"
                  />
                  <polygon fill="none"
                           points="100,40 155,85 135,145 65,145 45,85"
                           stroke="rgba(180,180,180,0.2)"
                           stroke-width="1"
                  />
                  <polygon fill="none"
                           points="100,70 130,95 120,125 80,125 70,95"
                           stroke="rgba(180,180,180,0.1)"
                           stroke-width="1"
                  />

                  <!-- 坐标轴 -->
                  <line stroke="rgba(180,180,180,0.2)" stroke-width="1" x1="100" x2="100" y1="10"
                        y2="170"/>
                  <line stroke="rgba(180,180,180,0.2)" stroke-width="1" x1="20" x2="180" y1="75"
                        y2="75"/>
                  <line stroke="rgba(180,180,180,0.2)" stroke-width="1" x1="50" x2="150" y1="170"
                        y2="170"/>

                  <!-- 数据多边形 -->
                  <polygon
                    class="radar-polygon"
                    fill="rgba(64, 158, 255, 0.2)"
                    points="100,20 160,80 135,155 65,155 40,80"
                    stroke="rgba(64, 158, 255, 0.8)"
                    stroke-width="2"
                  />

                  <!-- 数据点 -->
                  <circle class="radar-dot" cx="100" cy="20" fill="#409EFF" r="4"/>
                  <circle class="radar-dot" cx="160" cy="80" fill="#409EFF" r="4"/>
                  <circle class="radar-dot" cx="135" cy="155" fill="#409EFF" r="4"/>
                  <circle class="radar-dot" cx="65" cy="155" fill="#409EFF" r="4"/>
                  <circle class="radar-dot" cx="40" cy="80" fill="#409EFF" r="4"/>

                  <!-- 标签 -->
                  <text fill="currentColor" font-size="8" text-anchor="middle" x="100" y="5">
                    客户端
                  </text>
                  <text fill="currentColor" font-size="8" text-anchor="start" x="195" y="75">
                    移动端
                  </text>
                  <text fill="currentColor" font-size="8" text-anchor="middle" x="150" y="185">
                    其它
                  </text>
                  <text fill="currentColor" font-size="8" text-anchor="middle" x="50" y="185">
                    第三方
                  </text>
                  <text fill="currentColor" font-size="8" text-anchor="end" x="5" y="75">网页</text>
                </svg>
              </div>
            </div>

            <!-- 动态饼图 - 地区分布 -->
            <div class="col-span-1">
              <h3 class="text-sm font-medium text-gray-500 mb-3 text-center">地区分布</h3>
              <div class="pie-chart-container h-60 flex items-center justify-center">
                <svg class="rotating-pie" height="200" viewBox="0 0 200 200" width="200">
                  <defs>
                    <filter id="glow" height="160%" width="160%" x="-30%" y="-30%">
                      <feGaussianBlur result="blur" stdDeviation="3"/>
                      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                  </defs>

                  <!-- 光晕背景 -->
                  <circle cx="100" cy="100" fill="rgba(0,0,0,0.05)" filter="url(#glow)" r="85"/>

                  <!-- 基础圆形，显示全部饼图 -->
                  <circle cx="100" cy="100" fill="transparent" opacity="0.2" r="80" stroke="#fff"
                          stroke-width="1"/>

                  <!-- 饼图分段 - 使用SVG路径实现 -->
                  <!-- 北京: 25% = 90度 -->
                  <path
                    class="pie-segment"
                    d="M100,100 L100,20 A80,80 0 0,1 169.3,58.2 Z"
                    data-name="北京"
                    data-value="25%"
                    fill="#67C23A"
                    stroke="#fff"
                    stroke-width="1"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      dur="30s"
                      from="0 100 100"
                      repeatCount="indefinite"
                      to="360 100 100"
                      type="rotate"
                    />
                  </path>

                  <!-- 上海: 30% = 108度 -->
                  <path
                    class="pie-segment"
                    d="M100,100 L169.3,58.2 A80,80 0 0,1 169.3,141.8 Z"
                    data-name="上海"
                    data-value="30%"
                    fill="#409EFF"
                    stroke="#fff"
                    stroke-width="1"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      dur="30s"
                      from="0 100 100"
                      repeatCount="indefinite"
                      to="360 100 100"
                      type="rotate"
                    />
                  </path>

                  <!-- 广州: 18% = 64.8度 -->
                  <path
                    class="pie-segment"
                    d="M100,100 L169.3,141.8 A80,80 0 0,1 100,180 Z"
                    data-name="广州"
                    data-value="18%"
                    fill="#E6A23C"
                    stroke="#fff"
                    stroke-width="1"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      dur="30s"
                      from="0 100 100"
                      repeatCount="indefinite"
                      to="360 100 100"
                      type="rotate"
                    />
                  </path>

                  <!-- 成都: 15% = 54度 -->
                  <path
                    class="pie-segment"
                    d="M100,100 L100,180 A80,80 0 0,1 30.7,141.8 Z"
                    data-name="成都"
                    data-value="15%"
                    fill="#F56C6C"
                    stroke="#fff"
                    stroke-width="1"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      dur="30s"
                      from="0 100 100"
                      repeatCount="indefinite"
                      to="360 100 100"
                      type="rotate"
                    />
                  </path>

                  <!-- 其他: 12% = 43.2度 -->
                  <path
                    class="pie-segment"
                    d="M100,100 L30.7,141.8 A80,80 0 0,1 30.7,58.2 Z"
                    data-name="其他"
                    data-value="12%"
                    fill="#909399"
                    stroke="#fff"
                    stroke-width="1"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      dur="30s"
                      from="0 100 100"
                      repeatCount="indefinite"
                      to="360 100 100"
                      type="rotate"
                    />
                  </path>

                  <!-- 完成圆形 -->
                  <path
                    class="pie-segment"
                    d="M100,100 L30.7,58.2 A80,80 0 0,1 100,20 Z"
                    data-name=""
                    data-value="0%"
                    fill="#a287f4"
                    stroke="#fff"
                    stroke-width="1"
                  >
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      dur="30s"
                      from="0 100 100"
                      repeatCount="indefinite"
                      to="360 100 100"
                      type="rotate"
                    />
                  </path>

                  <!-- 中心镂空圆 -->
                  <circle class="inner-circle" cx="100" cy="100" fill="rgba(0,0,0,0.1)" r="40"/>

                  <!-- 中心文字 -->
                  <text fill="white" font-size="14" font-weight="bold" text-anchor="middle" x="100"
                        y="95">地区分布
                  </text>
                  <text fill="white" font-size="10" text-anchor="middle" x="100" y="115">实时旋转
                  </text>

                  <!-- 动态发光效果 -->
                  <circle cx="100" cy="100" fill="none" opacity="0.2" r="85"
                          stroke="rgba(255,255,255,0.3)" stroke-width="5">
                    <animate attributeName="opacity" dur="3s" repeatCount="indefinite"
                             values="0.1;0.3;0.1"/>
                  </circle>
                </svg>
              </div>

              <!-- 图例 -->
              <div class="grid grid-cols-3 gap-2 mt-2">
                <div class="flex items-center text-xs">
                  <span class="inline-block h-3 w-3 rounded-full mr-1 bg-green-500"></span>
                  <span>北京 25%</span>
                </div>
                <div class="flex items-center text-xs">
                  <span class="inline-block h-3 w-3 rounded-full mr-1 bg-blue-500"></span>
                  <span>上海 30%</span>
                </div>
                <div class="flex items-center text-xs">
                  <span class="inline-block h-3 w-3 rounded-full mr-1 bg-yellow-500"></span>
                  <span>广州 18%</span>
                </div>
                <div class="flex items-center text-xs">
                  <span class="inline-block h-3 w-3 rounded-full mr-1 bg-red-500"></span>
                  <span>成都 15%</span>
                </div>
                <div class="flex items-center text-xs">
                  <span class="inline-block h-3 w-3 rounded-full mr-1 bg-gray-500"></span>
                  <span>其他 12%</span>
                </div>
                <div class="flex items-center text-xs">
                  <span class="inline-block h-3 w-3 rounded-full mr-1 bg-purple-500"></span>
                  <span>保留</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 阅读时间分布 -->
        <div class="apple-card mb-4">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <Clock/>
            </el-icon>
            <h2 class="card-title-text">阅读时间分布</h2>
          </div>
          <div class="read-time-container space-y-3">
            <div v-for="(item, index) in readTimeData" :key="index" class="read-time-item">
              <div class="flex justify-between mb-1">
                <span class="text-sm">{{ item.time }}</span>
                <span class="text-sm font-semibold">{{ item.percentage }}%</span>
              </div>
              <div class="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  :style="{ width: `${item.percentage}%` }"
                  class="h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 dark:from-blue-500 dark:to-purple-600"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 苹果风格待办事项 -->
        <div class="apple-card mb-4">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <CircleCheck/>
            </el-icon>
            <h2 class="card-title-text">待办事项</h2>
          </div>

          <div class="apple-todo-container">
            <!-- 待办事项列表区域 -->
            <div class="todo-list-area">
              <div
                v-for="todo in todoItems"
                :key="todo.id"
                :class="{'completed': todo.completed}"
                class="apple-todo-item group"
              >
                <!-- 选择框和主要内容 -->
                <div class="todo-main-content">
                  <div
                    :class="{
                          'high-priority': todo.priority === 'high',
                          'medium-priority': todo.priority === 'medium',
                          'low-priority': todo.priority === 'low',
                          'checked': todo.completed
                        }"
                    class="apple-todo-checkbox"
                    @click="toggleTodoComplete(todo.id)"
                  >
                    <el-icon v-if="todo.completed" class="check-icon">
                      <CircleCheck/>
                    </el-icon>
                  </div>

                  <div class="todo-content" @click="toggleTodoComplete(todo.id)">
                    <div class="todo-title">{{ todo.title }}</div>
                    <div class="todo-meta">
                      <div class="meta-item deadline">
                        <el-icon>
                          <Calendar/>
                        </el-icon>
                        <span>{{ getDeadlineText(todo.deadline) }}</span>
                      </div>
                      <div class="meta-item priority">
                        <el-icon>
                          <Lightning/>
                        </el-icon>
                        <span>{{ getPriorityLabel(todo.priority) }}优先级</span>
                      </div>
                      <div v-if="todo.description" class="meta-item description">
                        <el-icon>
                          <ChatLineRound/>
                        </el-icon>
                        <span>{{ todo.description }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <div class="todo-actions">
                  <button class="todo-delete-btn" @click="deleteTodo(todo.id)">
                    <el-icon>
                      <Delete/>
                    </el-icon>
                  </button>
                </div>
              </div>

              <!-- 空状态展示 -->
              <div v-if="todoItems.length === 0" class="apple-todo-empty-state">
                <div class="empty-icon">
                  <el-icon>
                    <CircleCheck/>
                  </el-icon>
                </div>
                <div class="empty-message">
                  <div class="primary">所有任务已完成</div>
                  <div class="secondary">添加新任务来提升工作效率</div>
                </div>
              </div>
            </div>

            <!-- 添加新任务区域 -->
            <div class="add-todo-area">
              <div class="add-todo-input-container">
                <div
                  :class="{
                        'high-priority': newTodoPriority === 'high',
                        'medium-priority': newTodoPriority === 'medium',
                        'low-priority': newTodoPriority === 'low'
                      }"
                  class="apple-todo-checkbox add"
                >
                  <el-icon>
                    <Plus/>
                  </el-icon>
                </div>

                <input
                  v-model="newTodoTitle"
                  class="add-todo-input"
                  placeholder="添加新任务..."
                  @keyup.enter="addNewTodo"
                />
                  </div>

              <div class="add-todo-options">
                <div class="option-group">
                  <label>优先级</label>
                  <div class="priority-options">
                    <button
                      :class="{'active': newTodoPriority === 'high'}"
                      class="priority-option high"
                      @click="newTodoPriority = 'high'"
                    >
                      高
                    </button>
                    <button
                      :class="{'active': newTodoPriority === 'medium'}"
                      class="priority-option medium"
                      @click="newTodoPriority = 'medium'"
                    >
                      中
                    </button>
                    <button
                      :class="{'active': newTodoPriority === 'low'}"
                      class="priority-option low"
                      @click="newTodoPriority = 'low'"
                    >
                      低
                    </button>
                  </div>
                </div>

                <div class="option-group">
                  <label>截止日期</label>
                  <div class="date-selector">
                    <el-date-picker
                      v-model="newTodoDeadline"
                      :clearable="false"
                  :disabled-date="(time: Date) => time.getTime() < Date.now() - 8.64e7"
                      class="apple-date-picker"
                      format="MM/DD"
                      size="small"
                      type="date"
                      value-format="x"
                    />
                  </div>
              </div>

                <div class="option-group add-btn-group">
                  <button
                    :disabled="!newTodoTitle.trim()"
                    class="add-todo-btn"
                    @click="addNewTodo"
                  >
                    添加
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 待发布文章 -->
        <div class="apple-card">
          <div class="card-title">
            <el-icon :size="20" class="card-title-icon">
              <Calendar/>
            </el-icon>
            <h2 class="card-title-text">预定发布</h2>
          </div>

          <!-- 优化预定发布展示 -->
          <div class="scheduled-posts space-y-3">
            <div
              v-for="post in scheduledPosts"
              :key="post.id"
              class="scheduled-post rounded-lg backdrop-filter backdrop-blur-sm p-3 border border-gray-100 dark:border-gray-700"
            >
              <h3 class="post-title mb-1 font-medium">{{ post.title }}</h3>

              <!-- 进度条 -->
              <div
                class="progress-bar-container my-2 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-600">
                <div
                  :class="post.completionPercentage >= 70 ? 'bg-green-500' : post.completionPercentage >= 30 ? 'bg-yellow-500' : 'bg-red-500'"
                  :style="`width: ${post.completionPercentage}%`"
                  class="progress-bar h-full rounded-full"
                ></div>
              </div>

              <div class="flex justify-between text-xs text-gray-500">
                <span>完成度: {{ post.completionPercentage }}%</span>
                <span>{{ dayjs(post.scheduledPublishDate).format('MM月DD日 HH:mm') }}发布</span>
              </div>

              <el-button class="mt-2 w-full" plain size="small" type="info"
                         @click="editPost(post.id)">
                继续编辑
              </el-button>
            </div>

            <div v-if="scheduledPosts.length === 0"
                 class="empty-state rounded-lg backdrop-filter backdrop-blur-sm p-4 text-center border border-gray-100 dark:border-gray-700">
              <div class="text-sm text-gray-500">暂无计划发布的文章</div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 更新字体为苹果风格 */
:root {
  --apple-font: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif;
}

html, body, button, input, select, textarea {
  font-family: var(--apple-font);
}

.dashboard {
  background-color: var(--el-bg-color);
  font-family: var(--apple-font);
}

.dark .dashboard {
  background-color: var(--el-bg-color-dark);
}

/* 优化苹果风格下拉菜单 */
.apple-select :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  padding: 0 12px;
  height: 32px;
  transition: all 0.2s ease;
}

.dark .apple-select :deep(.el-input__wrapper) {
  background-color: rgba(30, 30, 30, 0.8);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.apple-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.dark .apple-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

/* 优化苹果风格日期选择器 */
.apple-date-picker :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  padding: 0 12px;
  height: 32px;
  transition: all 0.2s ease;
}

.dark .apple-date-picker :deep(.el-input__wrapper) {
  background-color: rgba(30, 30, 30, 0.8);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.apple-date-picker :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.dark .apple-date-picker :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

/* 优化苹果风格按钮 */
.apple-button {
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.apple-button:hover {
  transform: translateY(-1px);
}

.apple-button:active {
  transform: translateY(1px);
}

.welcome-card {
  animation: slideDown 0.5s ease-out forwards;
  transform-origin: top center;
}

@keyframes slideDown {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 头像旋转动画 */
.avatar-ring {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

/* 统计卡片动画 */
.stat-overview-card {
  animation: fadeIn 0.6s ease-out forwards;
  opacity: 0;
}

.stat-overview-card:nth-child(1) {
  animation-delay: 0.1s;
}

.stat-overview-card:nth-child(2) {
  animation-delay: 0.2s;
}

.stat-overview-card:nth-child(3) {
  animation-delay: 0.3s;
}

.stat-overview-card:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 卡片悬停效果增强 */
.stat-card, .apple-card {
  transition: all 0.3s ease;
}

.stat-card:hover, .apple-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

/* 苹果风格卡片样式 */
.apple-card {
  @apply bg-white dark:bg-gray-800 backdrop-blur-sm border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm;
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.apple-card:hover {
  @apply shadow-md dark:shadow-gray-900/30;
  transform: translateY(-2px);
}

/* 进度环样式 */
.goal-progress-ring circle {
  transition: stroke-dasharray 0.8s ease;
}

/* 饼图样式 */
.category-pie-chart {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
}

/* Mac风格待办事项 */
.mac-todo-item,
.activity-item,
.post-item,
.quick-nav-item,
.scheduled-post {
  transition: all 0.3s ease;
}

.mac-todo-item {
  border-radius: 10px;
  background-color: rgba(245, 245, 245, 0.6);
  backdrop-filter: blur(5px);
}

.dark .mac-todo-item {
  background-color: rgba(38, 38, 38, 0.6);
}

.mac-todo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: rgba(240, 240, 240, 0.8);
}

.dark .mac-todo-item:hover {
  background-color: rgba(48, 48, 48, 0.8);
}

.mac-todo-item.completed {
  opacity: 0.7;
}

.quick-nav-item {
  border-radius: 12px;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(220, 220, 220, 0.3);
}

.quick-nav-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.mac-todo-list {
  border-radius: 12px;
  background-color: rgba(250, 250, 250, 0.6);
  padding: 16px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.dark .mac-todo-list {
  background-color: rgba(30, 30, 30, 0.6);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
}

.mac-checkbox :deep(.el-checkbox__inner) {
  border-radius: 50%;
  width: 18px;
  height: 18px;
  transition: all 0.3s;
}

.mac-checkbox :deep(.el-checkbox__inner:hover) {
  border-color: var(--el-color-primary);
}

.mac-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  transition: all 0.3s;
  backdrop-filter: blur(5px);
}

.mac-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.dark .mac-input :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.dark .mac-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

/* 阅读时间分布样式 */
.read-time-item .h-2 .rounded-full {
  transition: width 1s ease-in-out;
}

/* 进度条动画 */
.progress-bar {
  transition: width 0.8s ease;
}

/* 图表动画效果 */
.radar-polygon {
  animation: radar-pulse 4s ease-in-out infinite;
}

.radar-dot {
  animation: glow 2s ease-in-out infinite;
}

.rotating-pie {
  filter: drop-shadow(0px 0px 10px rgba(0, 0, 0, 0.2));
}

.pie-segment {
  transition: transform 0.3s ease-out;
}

.pie-segment:hover {
  transform: translateX(5px) translateY(-5px);
  filter: brightness(1.1);
  cursor: pointer;
}

.inner-circle {
  animation: pulse-opacity 3s infinite ease-in-out;
}

@keyframes pulse-opacity {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.5;
  }
}

@keyframes radar-pulse {
  0% {
    opacity: 0.7;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    opacity: 0.7;
  }
}

@keyframes glow {
  0% {
    r: 3;
    opacity: 0.7;
  }
  50% {
    r: 5;
    opacity: 1;
  }
  100% {
    r: 3;
    opacity: 0.7;
  }
}

.action-button {
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
  opacity: 0;
  transform: scale(0.5);
  transition: transform 0.6s, opacity 0.6s;
}

.action-button:hover::before {
  opacity: 1;
  transform: scale(1);
}

.quick-nav-item {
  position: relative;
  overflow: hidden;
}

.quick-nav-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.quick-nav-item:hover::after {
  transform: translateX(100%);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color, #1890ff);
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 图表容器动画 */
.chart-container {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.chart-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

/* 卡片统一悬浮动效 */
.apple-card {
  transition: all 0.3s ease;
}

.apple-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

/* 按钮波纹效果优化 */
.action-button::before,
.quick-nav-item::after {
  pointer-events: none;
}

/* 卡片标题统一样式 */
.card-title {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.card-title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.1);
  color: var(--el-color-primary);
  border-radius: 8px;
  padding: 6px;
  margin-right: 8px;
}

.dark .card-title-icon {
  background: rgba(64, 158, 255, 0.2);
}

.card-title-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* "查看全部"按钮样式 */
.view-more-btn {
  transition: all 0.3s ease;
}

.view-more-btn:hover {
  transform: translateX(2px);
}

/* SEO 概览区域样式 */
.seo-data-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.seo-data-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.05);
}

.keyword-item {
  transition: all 0.25s ease;
}

.keyword-item:hover {
  transform: translateX(2px);
}

.rank-badge {
  transition: all 0.3s ease;
}

.keyword-item:hover .rank-badge {
  transform: scale(1.05);
}

/* 待办事项区域样式 */
.todo-container {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.modern-input :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 8px 12px;
  transition: all 0.3s ease;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.dark .modern-input :deep(.el-input__wrapper) {
  background-color: rgba(30, 30, 30, 0.8);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.modern-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.dark .modern-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.todo-item {
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.todo-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.todo-item:hover .delete-btn {
  opacity: 1;
}

.todo-checkbox {
  transition: all 0.2s ease;
}

.todo-checkbox:hover {
  transform: scale(1.1);
}

.delete-todo-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.delete-todo-btn:hover {
  opacity: 1;
}

/* 苹果待办事项样式 */
.apple-todo-container {
  background-color: rgba(250, 250, 250, 0.8);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  backdrop-filter: blur(20px);
  font-family: var(--apple-font);
}

.dark .apple-todo-container {
  background-color: rgba(30, 30, 30, 0.6);
}

/* 待办事项列表区域 */
.todo-list-area {
  max-height: 380px;
  overflow-y: auto;
  padding: 4px 0;
}

/* 待办事项条目 */
.apple-todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  transition: background-color 0.2s ease;
  position: relative;
  margin: 1px 0;
  border-radius: 8px;
}

.apple-todo-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.dark .apple-todo-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.apple-todo-item.completed .todo-title {
  text-decoration: line-through;
  color: #8e8e93;
}

/* 选择框和主要内容 */
.todo-main-content {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

/* 苹果风格复选框 */
.apple-todo-checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-right: 12px;
  border: 2px solid #d1d1d6;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background-color: transparent;
}

.dark .apple-todo-checkbox {
  border-color: #48484a;
}

.apple-todo-checkbox:hover {
  transform: scale(1.05);
}

.apple-todo-checkbox.high-priority {
  border-color: #ff3b30;
}

.apple-todo-checkbox.medium-priority {
  border-color: #ff9500;
}

.apple-todo-checkbox.low-priority {
  border-color: #34c759;
}

.apple-todo-checkbox.checked {
  background-color: #007aff;
  border-color: #007aff;
}

.dark .apple-todo-checkbox.checked {
  background-color: #0a84ff;
  border-color: #0a84ff;
}

.apple-todo-checkbox.checked.high-priority {
  background-color: #ff3b30;
  border-color: #ff3b30;
}

.apple-todo-checkbox.checked.medium-priority {
  background-color: #ff9500;
  border-color: #ff9500;
}

.apple-todo-checkbox.checked.low-priority {
  background-color: #34c759;
  border-color: #34c759;
}

.check-icon {
  color: white;
  font-size: 12px;
}

/* 待办内容 */
.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 15px;
  color: #000000;
  margin-bottom: 4px;
  font-weight: 400;
  transition: color 0.2s ease;
}

.dark .todo-title {
  color: #ffffff;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  color: #8e8e93;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item.priority {
  font-weight: 500;
}

.meta-item.deadline {
  color: #007aff;
}

.dark .meta-item.deadline {
  color: #0a84ff;
}

.meta-item.description {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

/* 操作按钮 */
.todo-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.apple-todo-item:hover .todo-actions {
  opacity: 1;
}

.todo-delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .todo-delete-btn {
  background-color: rgba(255, 69, 58, 0.2);
  color: #ff453a;
}

.todo-delete-btn:hover {
  background-color: rgba(255, 59, 48, 0.2);
  transform: scale(1.05);
}

/* 空状态 */
.apple-todo-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.empty-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(0, 122, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #007aff;
  font-size: 24px;
}

.dark .empty-icon {
  background-color: rgba(10, 132, 255, 0.2);
  color: #0a84ff;
}

.empty-message .primary {
  font-size: 17px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 4px;
}

.empty-message .secondary {
  font-size: 13px;
  color: #8e8e93;
}

.dark .empty-message .primary {
  color: #ffffff;
}

/* 添加新任务区域 */
.add-todo-area {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.dark .add-todo-area {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.add-todo-input-container {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.apple-todo-checkbox.add {
  background-color: rgba(0, 122, 255, 0.1);
  border: none;
  color: #007aff;
}

.dark .apple-todo-checkbox.add {
  background-color: rgba(10, 132, 255, 0.2);
  color: #0a84ff;
}

.apple-todo-checkbox.add.high-priority {
  background-color: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.apple-todo-checkbox.add.medium-priority {
  background-color: rgba(255, 149, 0, 0.1);
  color: #ff9500;
}

.apple-todo-checkbox.add.low-priority {
  background-color: rgba(52, 199, 89, 0.1);
  color: #34c759;
}

.dark .apple-todo-checkbox.add.high-priority {
  background-color: rgba(255, 69, 58, 0.2);
  color: #ff453a;
}

.dark .apple-todo-checkbox.add.medium-priority {
  background-color: rgba(255, 159, 10, 0.2);
  color: #ff9f0a;
}

.dark .apple-todo-checkbox.add.low-priority {
  background-color: rgba(48, 209, 88, 0.2);
  color: #30d158;
}

.add-todo-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  color: #000000;
  outline: none;
  padding: 8px 0;
  font-family: var(--apple-font);
}

.dark .add-todo-input {
  color: #ffffff;
}

.add-todo-input::placeholder {
  color: #8e8e93;
}

/* 添加任务选项 */
.add-todo-options {
  display: flex;
  align-items: center;
  gap: 16px;
}

.option-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-group label {
  font-size: 12px;
  color: #8e8e93;
  font-weight: 500;
}

/* 优先级选择器 */
.priority-options {
  display: flex;
  gap: 6px;
}

.priority-option {
  padding: 6px 12px;
  border-radius: 14px;
  border: 1px solid transparent;
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .priority-option {
  background-color: rgba(255, 255, 255, 0.08);
}

.priority-option.active {
  border-color: currentColor;
  font-weight: 500;
}

.priority-option.high {
  color: #ff3b30;
}

.priority-option.medium {
  color: #ff9500;
}

.priority-option.low {
  color: #34c759;
}

.dark .priority-option.high {
  color: #ff453a;
}

.dark .priority-option.medium {
  color: #ff9f0a;
}

.dark .priority-option.low {
  color: #30d158;
}

/* 日期选择器 */
.apple-date-picker {
  width: 120px;
}

.apple-date-picker :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 14px;
  box-shadow: none !important;
  padding: 2px 12px;
  height: 28px;
}

.dark .apple-date-picker :deep(.el-input__wrapper) {
  background-color: rgba(255, 255, 255, 0.08);
}

/* 添加按钮 */
.add-btn-group {
  margin-left: auto;
}

.add-todo-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .add-todo-btn {
  background-color: #0a84ff;
}

.add-todo-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.add-todo-btn:disabled {
  background-color: #c7c7cc;
  cursor: not-allowed;
}

.dark .add-todo-btn:disabled {
  background-color: #48484a;
}
</style>

