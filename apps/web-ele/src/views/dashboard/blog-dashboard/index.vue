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
    url: '/posts/save',
  },
  {
    title: '博客管理',
    icon: Reading,
    color: '#909399',
    url: '/posts/page',
  },
  {
    title: '分类管理',
    icon: Ticket,
    color: '#E6A23C',
    url: '/category/page',
  },
  {
    title: '标签管理',
    icon: Collection,
    color: '#F56C6C',
    url: '/tags/page',
  },
  {
    title: '评论管理',
    icon: Comment,
    color: '#909399',
    url: '/comment/page',
  },
  {
    title: '媒体管理',
    icon: Picture,
    color: '#67C23A',
    url: '/media/page',
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
    deadline: dayjs().add(3, 'day').valueOf(),
    priority: todoData.priority,
    completed: false
  };

  todoItems.value.unshift(newTask);
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
  router.push(`/posts/save/${id}`);
};

/**
 * 查看文章
 * @param id 文章ID
 */
const viewPost = (id: number | string) => {
  // 这里可以跳转到前台预览页面
  router.push(`/posts/preview/${id}`);
};

// 生命周期钩子
onMounted(() => {
  // 这里可以加载实际数据
});
</script>

<template>
  <div class="dashboard p-4">
    <!-- 个人欢迎区域 - 苹果风格 -->
    <div
      class="welcome-card mb-4 rounded-lg backdrop-blur-sm p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div class="flex items-center">
        <el-avatar :size="60" :src="userStore.userInfo?.avatar || preferences.app.defaultAvatar"/>
        <div class="ml-4">
          <h1 class="text-xl font-medium">{{ greeting }}，{{ userStore.userInfo?.realName }}</h1>
          <p class="mt-1 text-sm text-gray-500">{{ today }}，您的博客管理中心</p>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="mb-4">
      <AnalysisOverview :items="blogStats"/>
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
            <div class="flex items-center mb-3">
              <el-icon :size="20" class="mr-2">
                <PieChart/>
              </el-icon>
              <h2 class="text-lg font-medium">博客分类占比</h2>
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
            <div class="flex items-center mb-3">
              <el-icon :size="20" class="mr-2">
                <DataAnalysis/>
              </el-icon>
              <h2 class="text-lg font-medium">阅读量来源</h2>
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
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <TrendCharts/>
            </el-icon>
            <h2 class="text-lg font-medium">本月目标完成</h2>
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
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <Monitor/>
            </el-icon>
            <h2 class="text-lg font-medium">SEO概览</h2>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="seo-stat text-center">
              <div class="text-sm text-gray-500">自然流量</div>
              <div class="font-semibold text-lg">{{ formatNumber(seoData.organicTraffic) }}</div>
              <div class="text-xs text-green-500">↑8.4%</div>
            </div>
            <div class="seo-stat text-center">
              <div class="text-sm text-gray-500">反向链接</div>
              <div class="font-semibold text-lg">{{ formatNumber(seoData.backlinks) }}</div>
              <div class="text-xs text-green-500">↑3.2%</div>
            </div>
            <div class="seo-stat text-center">
              <div class="text-sm text-gray-500">平均排名</div>
              <div class="font-semibold text-lg">{{ seoData.averageRank }}</div>
              <div class="text-xs text-green-500">↓0.7</div>
            </div>
            <div class="seo-stat text-center">
              <div class="text-sm text-gray-500">展示次数</div>
              <div class="font-semibold text-lg">{{ formatNumber(seoData.impressions) }}</div>
              <div class="text-xs text-green-500">↑11.2%</div>
            </div>
            <div class="seo-stat text-center">
              <div class="text-sm text-gray-500">点击次数</div>
              <div class="font-semibold text-lg">{{ formatNumber(seoData.clicks) }}</div>
              <div class="text-xs text-green-500">↑6.8%</div>
            </div>
          </div>

          <!-- 热门关键词 -->
          <div class="mt-4">
            <h3 class="text-sm font-medium text-gray-500 mb-2">热门关键词</h3>
            <div class="space-y-2">
              <div v-for="(keyword, index) in topKeywords" :key="index"
                   class="flex items-center justify-between p-2 rounded-lg backdrop-blur-sm border border-gray-100 dark:border-gray-700">
                <div class="flex items-center">
                  <div
                    :class="keyword.rank <= 3 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'"
                    class="w-6 h-6 flex items-center justify-center rounded-full">
                    {{ keyword.rank }}
                  </div>
                  <span>{{ keyword.word }}</span>
                </div>
                <div class="flex items-center">
                  <span class="text-sm text-gray-500 mr-3">{{
                      formatNumber(keyword.volume)
                    }}/月</span>
                  <span :class="keyword.change > 0 ? 'text-green-500' : 'text-red-500'">
                    {{ keyword.change > 0 ? '↑' : '↓' }}{{ Math.abs(keyword.change) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 热门文章列表 -->
        <div class="apple-card mb-4">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center">
              <el-icon :size="20" class="mr-2">
                <Document/>
              </el-icon>
              <h2 class="text-lg font-medium">热门文章</h2>
            </div>
            <el-button plain size="small" type="info" @click="router.push('/posts/page')">查看所有
            </el-button>
          </div>

          <div class="popular-posts-list space-y-2">
            <div
              v-for="post in popularPosts"
              :key="post.id"
              class="post-item flex rounded-lg p-3 transition-all hover:bg-gray-50 dark:hover:bg-gray-750"
            >
              <div class="mr-3 flex-shrink-0">
                <el-tag
                  :type="post.id % 4 === 0 ? 'success' : post.id % 3 === 0 ? 'warning' : post.id % 2 === 0 ? 'info' : 'danger'"
                  class="rounded-md"
                  size="large">
                  {{ post.category?.charAt(0) || 'B' }}
                </el-tag>
              </div>
              <div class="flex-grow">
                <h3 class="post-title font-medium">{{ post.title }}</h3>
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
                <el-button-group>
                  <el-button :icon="View" size="small" type="info" @click="viewPost(post.id)"/>
                  <el-button :icon="Edit" size="small" type="success" @click="editPost(post.id)"/>
                </el-button-group>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近动态 -->
        <div class="apple-card">
          <div class="flex items-center mb-4">
            <el-icon :size="20" class="mr-2">
              <Bell/>
            </el-icon>
            <h2 class="text-lg font-medium">最近动态</h2>
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
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <Lightning/>
            </el-icon>
            <h2 class="text-lg font-medium">快捷操作</h2>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div
              v-for="item in quickNavItems"
              :key="item.title"
              :style="{ backgroundColor: `${item.color}10` }"
              class="quick-nav-item cursor-pointer rounded-lg p-3 text-center transition-all hover:shadow-md"
              @click="navTo(item)"
            >
              <el-icon :size="24" :style="{ color: item.color }" class="mb-2">
                <component :is="item.icon"/>
              </el-icon>
              <div class="text-xs font-medium">{{ item.title }}</div>
            </div>
          </div>
        </div>

        <!-- 读者用户画像 -->
        <div class="apple-card mb-4">
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <DataAnalysis/>
            </el-icon>
            <h2 class="text-lg font-medium">访问数据分析</h2>
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
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <Clock/>
            </el-icon>
            <h2 class="text-lg font-medium">阅读时间分布</h2>
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

        <!-- Mac风格待办事项 -->
        <div class="apple-card mb-4">
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <CircleCheck/>
            </el-icon>
            <h2 class="text-lg font-medium">待办事项</h2>
          </div>

          <div class="mac-todo-list">
            <!-- 添加新任务 -->
            <div class="add-todo mb-4">
              <el-input
                v-model="newTodoTitle"
                class="mb-2 mac-input"
                placeholder="添加新任务..."
                @keyup.enter="addTodo({title: newTodoTitle, priority: newTodoPriority})"
              >
                <template #prefix>
                  <el-icon>
                    <Plus/>
                  </el-icon>
                </template>
              </el-input>
              <div class="flex items-center">
                <span class="mr-2 text-xs text-gray-500">优先级:</span>
                <el-radio-group v-model="newTodoPriority" size="small">
                  <el-radio-button label="high">高</el-radio-button>
                  <el-radio-button label="medium">中</el-radio-button>
                  <el-radio-button label="low">低</el-radio-button>
                </el-radio-group>
                <el-button :icon="Plus" class="ml-auto" type="info"
                           @click="addTodo({title: newTodoTitle, priority: newTodoPriority})">添加
                </el-button>
              </div>
            </div>

            <!-- 任务列表 -->
            <div class="mac-todo-items space-y-1">
              <div
                v-for="todo in todoItems"
                :key="todo.id"
                :class="[todo.completed ? 'bg-gray-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-750']"
                class="mac-todo-item flex items-center rounded-lg p-3 transition-all"
              >
                <el-checkbox
                  v-model="todo.completed"
                  :style="{ color: getPriorityColor(todo.priority) }"
                  class="mr-3 mac-checkbox"
                  @change="() => toggleTodoComplete(todo.id)"
                />
                <div class="flex-grow">
                  <div
                    :class="{'line-through opacity-60': todo.completed}"
                    class="todo-title font-medium"
                  >
                    {{ todo.title }}
                  </div>
                  <div class="todo-meta mt-1 flex items-center space-x-2 text-xs text-gray-500">
                    <el-tag
                      :type="todo.priority === 'high' ? 'danger' : todo.priority === 'medium' ? 'warning' : 'success'"
                      size="small">
                      {{ getPriorityLabel(todo.priority) }}优先级
                    </el-tag>
                    <span class="flex items-center">
                      <el-icon class="mr-1"><Calendar/></el-icon>
                      {{ getDeadlineText(todo.deadline) }}
                    </span>
                  </div>
                  <div v-if="todo.description" class="mt-1 text-xs text-gray-500">
                    {{ todo.description }}
                  </div>
                </div>
                <el-button
                  :icon="Delete"
                  circle
                  class="opacity-70 hover:opacity-100"
                  size="small"
                  type="danger"
                  @click="deleteTodo(todo.id)"
                />
              </div>

              <div v-if="todoItems.length === 0"
                   class="empty-state rounded-lg bg-gray-50 dark:bg-gray-700 p-4 text-center">
                <el-icon :size="24" class="mb-2">
                  <CircleCheck/>
                </el-icon>
                <div class="text-sm text-gray-500">暂无待办事项</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 待发布文章 -->
        <div class="apple-card">
          <div class="flex items-center mb-3">
            <el-icon :size="20" class="mr-2">
              <Calendar/>
            </el-icon>
            <h2 class="text-lg font-medium">预定发布</h2>
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
</template>

<style scoped>
.dashboard {
  background-color: var(--el-bg-color);
}

.dark .dashboard {
  background-color: var(--el-bg-color-dark);
}

/* 苹果风格卡片样式 */
.apple-card {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 20px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  border: 1px solid rgba(220, 220, 220, 0.5);
}

.dark .apple-card {
  background-color: rgba(40, 40, 40, 0.8);
  border: 1px solid rgba(80, 80, 80, 0.3);
}

.apple-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
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
    opacity: 0.8;
  }
  50% {
    r: 5;
    opacity: 1;
  }
  100% {
    r: 3;
    opacity: 0.8;
  }
}

/* 苹果风格的按钮 */
:deep(.el-button) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-radio-button__inner) {
  backdrop-filter: blur(5px);
}

/* 苹果风格滚动条 */
:deep(::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(::-webkit-scrollbar-track) {
  background: transparent;
}

:deep(::-webkit-scrollbar-thumb) {
  background: rgba(180, 180, 180, 0.5);
  border-radius: 10px;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: rgba(150, 150, 150, 0.7);
}
</style>
