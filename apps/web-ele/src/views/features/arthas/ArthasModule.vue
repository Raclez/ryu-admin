<script setup>
import {ref, reactive, onMounted, inject} from 'vue';
import axios from 'axios';
import {
  ArrowDown,
  ArrowUp,
  Connection,
  Cpu,
  Document,
  DocumentCopy,
  Edit,
  InfoFilled,
  Search,
  Monitor,
  VideoPause,
  Timer,
  View,
  Refresh,
  List,
  Check
} from '@element-plus/icons-vue';

// 模块列表
const moduleList = reactive([
  {
    id: 'dashboard',
    title: '系统仪表盘',
    icon: Monitor,
    description: '实时查看系统状态、内存、CPU、线程信息等',
    color: '#409EFF',
    features: [
      '实时监控CPU使用率',
      '查看JVM内存使用情况',
      '监控线程状态分布',
      '查看系统负载'
    ]
  },
  {
    id: 'thread',
    title: '线程分析',
    icon: Connection,
    description: '分析线程状态，定位死锁、高CPU线程等问题',
    color: '#67C23A',
    features: [
      '查看线程栈信息',
      '定位CPU使用率高的线程',
      '检测线程死锁',
      '统计线程状态分布'
    ]
  },
  {
    id: 'classloader',
    title: '类加载分析',
    icon: Document,
    description: '查看类加载信息，排查类加载问题',
    color: '#E6A23C',
    features: [
      '查看类加载器层次结构',
      '查找类加载来源',
      '统计类加载信息',
      '检测重复加载类情况'
    ]
  },
  {
    id: 'memory',
    title: '内存分析',
    icon: Cpu,
    description: '分析内存使用情况，排查内存泄漏',
    color: '#F56C6C',
    features: [
      '生成堆转储文件',
      '分析对象占用内存',
      '检测内存泄漏',
      '查看垃圾回收状态'
    ]
  },
  {
    id: 'decompile',
    title: '反编译',
    icon: Edit,
    description: '查看运行时类的源代码，确认代码版本',
    color: '#909399',
    features: [
      '反编译运行中的类',
      '确认代码是否为期望版本',
      '查看类的具体实现',
      '排查代码逻辑问题'
    ]
  },
  {
    id: 'monitor',
    title: '方法监控',
    icon: Timer,
    description: '监控方法执行情况，统计耗时、异常等',
    color: '#9B59B6',
    features: [
      '监控方法调用次数和耗时',
      '统计方法执行成功率',
      '捕获方法执行异常',
      '分析方法性能瓶颈'
    ]
  },
  {
    id: 'watch',
    title: '方法观察',
    icon: View,
    description: '观察方法的入参、返回值、异常等信息',
    color: '#3498DB',
    features: [
      '查看方法入参和返回值',
      '捕获方法抛出的异常',
      '根据条件表达式过滤',
      '深入分析参数内容'
    ]
  },
  {
    id: 'trace',
    title: '方法追踪',
    icon: Connection,
    description: '追踪方法调用路径，统计每个环节的耗时',
    color: '#1ABC9C',
    features: [
      '分析方法调用链路',
      '统计各环节耗时',
      '发现性能瓶颈',
      '优化系统调用'
    ]
  },
  {
    id: 'stack',
    title: '调用栈分析',
    icon: List,
    description: '查看方法的调用栈，了解调用来源',
    color: '#E74C3C',
    features: [
      '查看方法被调用的路径',
      '了解方法调用来源',
      '定位复杂调用关系',
      '排查意外调用'
    ]
  },
  {
    id: 'profiler',
    title: '性能分析',
    icon: Cpu,
    description: '生成火焰图，全方位分析性能瓶颈',
    color: '#D35400',
    features: [
      '生成CPU使用火焰图',
      '分析内存分配情况',
      '检测锁竞争热点',
      '全面诊断性能问题'
    ]
  },
  {
    id: 'jvm',
    title: 'JVM信息',
    icon: InfoFilled,
    description: '查看JVM参数、系统属性等基本信息',
    color: '#2980B9',
    features: [
      '查看JVM版本和参数',
      '查看系统属性',
      '查看环境变量',
      '诊断JVM配置问题'
    ]
  },
  {
    id: 'redefine',
    title: '热更新',
    icon: Refresh,
    description: '在不重启JVM的情况下更新类的实现',
    color: '#8E44AD',
    features: [
      '不重启即可修复Bug',
      '在线更新代码实现',
      '快速验证解决方案',
      '减少线上问题影响'
    ]
  }
]);

// 应用实例列表
const instances = ref([]);
const instancesLoading = ref(false);

// 当前选中的模块
const currentModule = ref(null);
const showModuleDetail = ref(false);

// 打开模块详情
const openModuleDetail = (module) => {
  currentModule.value = module;
  showModuleDetail.value = true;
};

// 关闭模块详情
const closeModuleDetail = () => {
  showModuleDetail.value = false;
};

// 跳转到模块页面
const navigateToModule = (moduleId) => {
  // 这里可以根据实际需求进行路由跳转
  console.log('跳转到模块:', moduleId);
};

// 打开完整控制台
const openConsole = () => {
  const changeTabToConsole = inject('changeTabToConsole', null);
  if (changeTabToConsole) {
    changeTabToConsole();
  } else {
    // 跳转到控制台页面的备选方案
    console.log('打开完整控制台 - 未能获取切换标签方法');
  }
};

// 最近使用的命令
const recentCommands = ref([]);
const commandsLoading = ref(false);

// 热门排查案例
const popularCases = ref([]);
const casesLoading = ref(false);

// 获取应用实例列表
const fetchInstances = async () => {
  instancesLoading.value = true;
  try {
    // 实际应该调用后端API
    // const response = await axios.get('/api/arthas/instances');
    // instances.value = response.data;

    // 临时模拟数据
    setTimeout(() => {
      instances.value = [
        {id: 1, name: 'SpringBoot应用', pid: '12345', host: 'app-server-1', status: 'online'},
        {id: 2, name: 'Tomcat服务器', pid: '23456', host: 'app-server-2', status: 'online'},
        {id: 3, name: '微服务实例', pid: '34567', host: 'app-server-3', status: 'offline'},
      ];
      instancesLoading.value = false;
    }, 1000);
  } catch (error) {
    console.error('获取应用实例失败', error);
    ElMessage.error('获取应用实例失败');
    instancesLoading.value = false;
  }
};

// 获取最近命令列表
const fetchRecentCommands = async () => {
  commandsLoading.value = true;
  try {
    // 实际应该调用后端API
    // const response = await axios.get('/api/arthas/recent-commands');
    // recentCommands.value = response.data;

    // 临时模拟数据
    setTimeout(() => {
      recentCommands.value = [
        {command: 'dashboard', time: '10分钟前', result: '成功'},
        {command: 'thread -n 3', time: '30分钟前', result: '成功'},
        {command: 'jvm', time: '1小时前', result: '成功'},
        {command: 'heap dump', time: '3小时前', result: '成功'},
      ];
      commandsLoading.value = false;
    }, 1200);
  } catch (error) {
    console.error('获取最近命令失败', error);
    ElMessage.error('获取最近命令失败');
    commandsLoading.value = false;
  }
};

// 获取热门案例
const fetchPopularCases = async () => {
  casesLoading.value = true;
  try {
    // 实际应该调用后端API
    // const response = await axios.get('/api/arthas/popular-cases');
    // popularCases.value = response.data;

    // 临时模拟数据
    setTimeout(() => {
      popularCases.value = [
        {
          title: 'CPU使用率飙升',
          description: '使用thread命令找出CPU使用率最高的线程，并分析其堆栈',
          tags: ['CPU', '性能', '线程'],
          link: 'https://arthas.aliyun.com/doc/thread.html'
        },
        {
          title: '内存泄漏',
          description: '使用heapdump生成堆转储文件，并使用MAT等工具分析',
          tags: ['内存', '泄漏', 'GC'],
          link: 'https://arthas.aliyun.com/doc/heapdump.html'
        },
        {
          title: '类加载问题',
          description: '使用sc、classloader命令查找类的来源和加载情况',
          tags: ['类加载', 'Jar包', '依赖'],
          link: 'https://arthas.aliyun.com/doc/sc.html'
        },
        {
          title: '方法执行异常',
          description: '使用watch命令观察方法的入参和异常信息',
          tags: ['异常', '排查', '监控'],
          link: 'https://arthas.aliyun.com/doc/watch.html'
        },
      ];
      casesLoading.value = false;
    }, 800);
  } catch (error) {
    console.error('获取热门案例失败', error);
    ElMessage.error('获取热门案例失败');
    casesLoading.value = false;
  }
};

onMounted(() => {
  fetchInstances();
  fetchRecentCommands();
  fetchPopularCases();
});
</script>

<template>
  <div class="arthas-module-container">
    <el-row :gutter="16">
      <!-- 头部信息 -->
      <el-col :span="24">
        <el-card class="header-card">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="logo-container">
                <img alt="Arthas Logo" class="arthas-logo"
                     src="https://arthas.aliyun.com/doc/_images/arthas.png">
              </div>
              <div class="header-info ml-4">
                <h1 class="text-2xl font-bold">Arthas Java诊断工具</h1>
                <p class="text-gray-500">强大的Java诊断工具，无需重启即可排查线上问题</p>
              </div>
            </div>
            <div class="header-actions">
              <el-button :icon="VideoPause" type="primary" @click="openConsole">
                打开命令控制台
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 模块列表 -->
      <el-col :span="24" class="mt-4">
        <el-card>
          <template #header>
            <div class="flex items-center">
              <el-icon class="mr-2">
                <List/>
              </el-icon>
              <span>功能模块</span>
            </div>
          </template>

          <el-row :gutter="16">
            <el-col
              v-for="module in moduleList"
              :key="module.id"
              :lg="6"
              :md="8"
              :sm="12"
              :xl="4"
              :xs="24"
              class="mb-4"
            >
              <div
                class="module-card"
                @click="openModuleDetail(module)"
              >
                <div :style="{ backgroundColor: module.color + '20', color: module.color }"
                     class="module-icon">
                  <el-icon :size="24">
                    <component :is="module.icon"/>
                  </el-icon>
                </div>
                <div class="module-info">
                  <h3 class="module-title">{{ module.title }}</h3>
                  <p class="module-desc">{{ module.description }}</p>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- 应用实例和热门案例 -->
      <el-col :span="24" class="mt-4">
        <el-row :gutter="16">
          <!-- 应用实例 -->
          <el-col :span="12">
            <el-card class="instance-card">
              <template #header>
                <div class="flex items-center">
                  <el-icon class="mr-2">
                    <Connection/>
                  </el-icon>
                  <span>应用实例</span>
                </div>
              </template>

              <el-table :data="instances" style="width: 100%">
                <el-table-column label="应用名称" prop="name"/>
                <el-table-column label="PID" prop="pid" width="100"/>
                <el-table-column label="主机" prop="host"/>
                <el-table-column label="状态" prop="status" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="scope.row.status === 'online' ? 'success' : 'danger'"
                      size="small"
                    >
                      {{ scope.row.status === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button
                      :disabled="scope.row.status !== 'online'"
                      size="small"
                      type="primary"
                      @click="openConsole"
                    >
                      连接
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <!-- 热门排查案例 -->
          <el-col :span="12">
            <el-card class="instance-card">
              <template #header>
                <div class="flex items-center">
                  <el-icon class="mr-2">
                    <Document/>
                  </el-icon>
                  <span>热门排查案例</span>
                </div>
              </template>

              <el-scrollbar height="280px">
                <div
                  v-for="(item, index) in popularCases"
                  :key="index"
                  class="case-item"
                >
                  <h3 class="case-title">{{ item.title }}</h3>
                  <p class="case-desc">{{ item.description }}</p>
                  <div class="case-tags">
                    <el-tag
                      v-for="tag in item.tags"
                      :key="tag"
                      class="mr-1"
                      size="small"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                  <el-link
                    :href="item.link"
                    class="case-link"
                    target="_blank"
                    type="primary"
                  >
                    查看详情
                  </el-link>
                </div>
              </el-scrollbar>
            </el-card>
          </el-col>
        </el-row>
      </el-col>

      <!-- 最近使用的命令 -->
      <el-col :span="24" class="mt-4">
        <el-card>
          <template #header>
            <div class="flex items-center">
              <el-icon class="mr-2">
                <Timer/>
              </el-icon>
              <span>最近使用的命令</span>
            </div>
          </template>

          <el-table :data="recentCommands" style="width: 100%">
            <el-table-column label="命令" prop="command"/>
            <el-table-column label="执行时间" prop="time" width="120"/>
            <el-table-column label="执行结果" prop="result" width="100">
              <template #default="scope">
                <el-tag size="small" type="success">{{ scope.row.result }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button-group>
                  <el-button
                    plain
                    size="small"
                    type="primary"
                    @click="navigateToModule('console')"
                  >
                    重新执行
                  </el-button>
                  <el-button
                    plain
                    size="small"
                    type="info"
                    @click="openConsole"
                  >
                    查看结果
                  </el-button>
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 模块详情对话框 -->
    <el-dialog
      v-model="showModuleDetail"
      :title="currentModule?.title"
      width="50%"
    >
      <div v-if="currentModule" class="module-detail">
        <div :style="{ backgroundColor: currentModule.color + '20' }" class="module-header">
          <div :style="{ backgroundColor: currentModule.color + '30', color: currentModule.color }"
               class="module-icon-large">
            <el-icon :size="32">
              <component :is="currentModule.icon"/>
            </el-icon>
          </div>
          <div class="module-header-info">
            <h2 class="text-xl font-bold">{{ currentModule.title }}</h2>
            <p class="text-gray-600">{{ currentModule.description }}</p>
          </div>
        </div>

        <div class="module-features mt-4">
          <h3 class="text-lg font-medium mb-3">主要功能</h3>
          <el-row :gutter="16">
            <el-col v-for="(feature, index) in currentModule.features" :key="index" :span="12"
                    class="mb-2">
              <div class="feature-item">
                <el-icon :style="{ color: currentModule.color }">
                  <Check/>
                </el-icon>
                <span>{{ feature }}</span>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="module-commands mt-4">
          <h3 class="text-lg font-medium mb-3">相关命令</h3>
          <el-tag
            v-if="currentModule.id === 'dashboard'"
            class="mr-2 mb-2"
            @click="navigateToModule('dashboard')"
          >
            dashboard
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'thread'"
            class="mr-2 mb-2"
            @click="navigateToModule('thread')"
          >
            thread
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'thread'"
            class="mr-2 mb-2"
            @click="navigateToModule('thread')"
          >
            thread -n 3
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'thread'"
            class="mr-2 mb-2"
            @click="navigateToModule('thread')"
          >
            thread -b
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'classloader'"
            class="mr-2 mb-2"
            @click="navigateToModule('classloader')"
          >
            classloader
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'memory'"
            class="mr-2 mb-2"
            @click="navigateToModule('memory')"
          >
            heapdump
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'decompile'"
            class="mr-2 mb-2"
            @click="navigateToModule('decompile')"
          >
            jad
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'monitor'"
            class="mr-2 mb-2"
            @click="navigateToModule('monitor')"
          >
            monitor
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'watch'"
            class="mr-2 mb-2"
            @click="navigateToModule('watch')"
          >
            watch
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'trace'"
            class="mr-2 mb-2"
            @click="navigateToModule('trace')"
          >
            trace
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'stack'"
            class="mr-2 mb-2"
            @click="navigateToModule('stack')"
          >
            stack
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'profiler'"
            class="mr-2 mb-2"
            @click="navigateToModule('profiler')"
          >
            profiler
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'jvm'"
            class="mr-2 mb-2"
            @click="navigateToModule('jvm')"
          >
            jvm
          </el-tag>
          <el-tag
            v-if="currentModule.id === 'redefine'"
            class="mr-2 mb-2"
            @click="navigateToModule('redefine')"
          >
            redefine
          </el-tag>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeModuleDetail">关闭</el-button>
          <el-button type="primary" @click="navigateToModule(currentModule?.id)">
            使用此功能
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.arthas-module-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);

  .header-card {
    border-radius: 8px;
    overflow: hidden;
    background-color: var(--el-bg-color);

    .arthas-logo {
      height: 64px;
      width: auto;
    }
  }

  .module-card {
    height: 120px;
    border-radius: 8px;
    padding: 16px;
    background-color: var(--el-bg-color);
    box-shadow: var(--el-box-shadow-light);
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
      box-shadow: var(--el-box-shadow);
    }

    .module-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
    }

    .module-info {
      flex: 1;

      .module-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .module-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
  }

  .instance-card {
    height: 100%;
    background-color: var(--el-bg-color);
  }

  .case-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    &:last-child {
      border-bottom: none;
    }

    .case-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .case-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 8px;
    }

    .case-tags {
      margin-bottom: 8px;
    }

    .case-link {
      font-size: 12px;
    }
  }

  .module-detail {
    .module-header {
      padding: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;

      .module-icon-large {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
  }

  .el-tag {
    cursor: pointer;
  }
}

.tab-header {
  padding: 0 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.command-button {
  &:hover {
    background-color: var(--el-fill-color-light);
  }
}
</style>
