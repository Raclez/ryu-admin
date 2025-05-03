<script setup>
import {ref, reactive, onMounted, computed} from 'vue';
import {
  ArrowDown,
  ArrowUp,
  CaretRight,
  Connection,
  CPU,
  DocumentCopy,
  Lock,
  Refresh,
  Search,
  Timer,
  Warning
} from '@element-plus/icons-vue';

// 线程状态数据
const threadStats = reactive({
  total: 0,
  running: 0,
  waiting: 0,
  blocked: 0,
  timed_waiting: 0,
  new: 0,
  terminated: 0
});

// 线程列表
const threadList = ref([]);

// 线程详情
const selectedThread = ref(null);
const threadStackVisible = ref(false);

// 显示状态
const loading = ref(false);
const searchKeyword = ref('');

// 图表数据
const chartOptions = reactive({
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 10,
    data: ['运行中', '等待', '阻塞', '计时等待', '新建', '终止']
  },
  series: [
    {
      name: '线程状态',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        {value: 0, name: '运行中', itemStyle: {color: '#67C23A'}},
        {value: 0, name: '等待', itemStyle: {color: '#E6A23C'}},
        {value: 0, name: '阻塞', itemStyle: {color: '#F56C6C'}},
        {value: 0, name: '计时等待', itemStyle: {color: '#909399'}},
        {value: 0, name: '新建', itemStyle: {color: '#409EFF'}},
        {value: 0, name: '终止', itemStyle: {color: '#9B59B6'}}
      ]
    }
  ]
});

// 死锁检测
const deadlockInfo = ref({
  hasDeadlock: false,
  threads: []
});

// 线程状态映射
const threadStateMap = {
  'RUNNABLE': {name: '运行中', type: 'success'},
  'WAITING': {name: '等待', type: 'warning'},
  'BLOCKED': {name: '阻塞', type: 'danger'},
  'TIMED_WAITING': {name: '计时等待', type: 'info'},
  'NEW': {name: '新建', type: 'primary'},
  'TERMINATED': {name: '终止', type: ''}
};

// 获取线程信息
const fetchThreadInfo = () => {
  loading.value = true;

  // 模拟请求API
  setTimeout(() => {
    // 模拟数据
    threadStats.total = 32;
    threadStats.running = 8;
    threadStats.waiting = 10;
    threadStats.blocked = 2;
    threadStats.timed_waiting = 10;
    threadStats.new = 1;
    threadStats.terminated = 1;

    // 更新图表数据
    chartOptions.series[0].data[0].value = threadStats.running;
    chartOptions.series[0].data[1].value = threadStats.waiting;
    chartOptions.series[0].data[2].value = threadStats.blocked;
    chartOptions.series[0].data[3].value = threadStats.timed_waiting;
    chartOptions.series[0].data[4].value = threadStats.new;
    chartOptions.series[0].data[5].value = threadStats.terminated;

    // 模拟线程列表
    threadList.value = generateMockThreads();

    // 模拟死锁检测
    deadlockInfo.value = {
      hasDeadlock: true,
      threads: [
        {id: 15, name: 'DeadlockThread-1', state: 'BLOCKED', lockOwner: 16},
        {id: 16, name: 'DeadlockThread-2', state: 'BLOCKED', lockOwner: 15}
      ]
    };

    loading.value = false;
  }, 1000);
};

// 根据关键词过滤线程
const filteredThreads = computed(() => {
  if (!searchKeyword.value) {
    return threadList.value;
  }

  const keyword = searchKeyword.value.toLowerCase();
  return threadList.value.filter(thread =>
    thread.name.toLowerCase().includes(keyword) ||
    thread.id.toString().includes(keyword) ||
    thread.state.toLowerCase().includes(keyword)
  );
});

// 查看线程堆栈
const viewThreadStack = (thread) => {
  selectedThread.value = thread;
  threadStackVisible.value = true;
};

// 复制堆栈信息
const copyStackTrace = () => {
  if (selectedThread.value && selectedThread.value.stackTrace) {
    const stackText = selectedThread.value.stackTrace.join('\n');
    navigator.clipboard.writeText(stackText)
      .then(() => {
        ElMessage.success('堆栈信息已复制到剪贴板');
      })
      .catch(() => {
        ElMessage.error('复制失败');
      });
  }
};

// 生成模拟线程数据
const generateMockThreads = () => {
  const threads = [];

  // RUNNABLE线程
  for (let i = 0; i < threadStats.running; i++) {
    threads.push({
      id: i + 1,
      name: `http-nio-8080-exec-${i + 1}`,
      state: 'RUNNABLE',
      cpuUsage: Math.random() * 10,
      time: Math.floor(Math.random() * 60000),
      priority: 5,
      daemon: false,
      stackTrace: [
        'java.net.SocketInputStream.socketRead0(Native Method)',
        'java.net.SocketInputStream.socketRead(SocketInputStream.java:116)',
        'java.net.SocketInputStream.read(SocketInputStream.java:171)',
        'java.net.SocketInputStream.read(SocketInputStream.java:141)',
        'org.apache.coyote.http11.Http11InputBuffer.fill(Http11InputBuffer.java:1104)',
        'org.apache.coyote.http11.Http11InputBuffer.parseRequestLine(Http11InputBuffer.java:367)',
        'org.apache.coyote.http11.Http11Processor.service(Http11Processor.java:394)',
        'org.apache.coyote.AbstractProcessorLight.process(AbstractProcessorLight.java:65)',
        'org.apache.coyote.AbstractProtocol$ConnectionHandler.process(AbstractProtocol.java:890)',
        'org.apache.tomcat.util.net.NioEndpoint$SocketProcessor.doRun(NioEndpoint.java:1743)',
        'org.apache.tomcat.util.net.SocketProcessorBase.run(SocketProcessorBase.java:49)',
        'java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)',
        'java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)',
        'org.apache.tomcat.util.threads.TaskThread$WrappingRunnable.run(TaskThread.java:61)',
        'java.lang.Thread.run(Thread.java:748)'
      ]
    });
  }

  // WAITING线程
  for (let i = 0; i < threadStats.waiting; i++) {
    threads.push({
      id: threadStats.running + i + 1,
      name: `pool-1-thread-${i + 1}`,
      state: 'WAITING',
      cpuUsage: 0,
      time: Math.floor(Math.random() * 120000),
      priority: 5,
      daemon: false,
      stackTrace: [
        'java.lang.Object.wait(Native Method)',
        'java.lang.Object.wait(Object.java:502)',
        'java.util.concurrent.LinkedBlockingQueue.take(LinkedBlockingQueue.java:442)',
        'java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:1079)',
        'java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1134)',
        'java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)',
        'java.lang.Thread.run(Thread.java:748)'
      ]
    });
  }

  // BLOCKED线程
  for (let i = 0; i < threadStats.blocked; i++) {
    threads.push({
      id: threadStats.running + threadStats.waiting + i + 1,
      name: `DeadlockThread-${i + 1}`,
      state: 'BLOCKED',
      cpuUsage: 0,
      time: Math.floor(Math.random() * 30000),
      priority: 5,
      daemon: false,
      stackTrace: [
        'java.lang.Thread.run(Thread.java:748)',
        'java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:624)',
        'java.util.concurrent.ThreadPoolExecutor.runWorker(ThreadPoolExecutor.java:1149)',
        'java.util.concurrent.locks.ReentrantLock$Sync.lock(ReentrantLock.java:157)',
        'java.util.concurrent.locks.ReentrantLock.lock(ReentrantLock.java:285)',
        'com.example.demo.DeadlockExample.lambda$deadlock$1(DeadlockExample.java:45)',
      ]
    });
  }

  // TIMED_WAITING线程
  for (let i = 0; i < threadStats.timed_waiting; i++) {
    threads.push({
      id: threadStats.running + threadStats.waiting + threadStats.blocked + i + 1,
      name: `Timer-${i + 1}`,
      state: 'TIMED_WAITING',
      cpuUsage: 0,
      time: Math.floor(Math.random() * 60000),
      priority: 5,
      daemon: true,
      stackTrace: [
        'java.lang.Thread.sleep(Native Method)',
        'java.util.concurrent.TimeUnit.sleep(TimeUnit.java:446)',
        'java.util.concurrent.ThreadPoolExecutor.awaitTermination(ThreadPoolExecutor.java:1475)',
        'com.example.demo.TimerExample.waitForCompletion(TimerExample.java:78)',
        'com.example.demo.TimerExample.lambda$startTimer$0(TimerExample.java:42)',
        'java.lang.Thread.run(Thread.java:748)'
      ]
    });
  }

  // 添加其他状态线程...

  return threads;
};

// 格式化时间
const formatTime = (ms) => {
  if (!ms) return '0ms';

  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchThreadInfo();
});
</script>

<template>
  <div class="thread-analyzer-container">
    <el-card class="thread-overview-card mb-4">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-2">
              <Connection/>
            </el-icon>
            <span class="text-lg font-medium">线程状态总览</span>
          </div>
          <el-button
            :icon="Refresh"
            :loading="loading"
            circle
            @click="fetchThreadInfo"
          />
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :sm="16" :xs="24">
          <div class="thread-stats">
            <div class="thread-stat-item">
              <div class="stat-value">{{ threadStats.total }}</div>
              <div class="stat-label">总线程数</div>
            </div>
            <div class="thread-stat-item running">
              <div class="stat-value">{{ threadStats.running }}</div>
              <div class="stat-label">运行中</div>
            </div>
            <div class="thread-stat-item waiting">
              <div class="stat-value">{{ threadStats.waiting }}</div>
              <div class="stat-label">等待</div>
            </div>
            <div class="thread-stat-item blocked">
              <div class="stat-value">{{ threadStats.blocked }}</div>
              <div class="stat-label">阻塞</div>
            </div>
            <div class="thread-stat-item timed-waiting">
              <div class="stat-value">{{ threadStats.timed_waiting }}</div>
              <div class="stat-label">计时等待</div>
            </div>
          </div>
        </el-col>

        <el-col :sm="8" :xs="24">
          <div class="thread-chart">
            <v-chart :option="chartOptions" autoresize class="chart"/>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="16" class="mb-4">
      <el-col :span="24">
        <el-card v-if="deadlockInfo.hasDeadlock" class="deadlock-card">
          <el-alert
            :closable="false"
            show-icon
            title="检测到线程死锁"
            type="error"
          >
            <template #default>
              <div class="mt-2">
                发现 {{ deadlockInfo.threads.length }} 个线程处于死锁状态。
              </div>
              <div class="deadlock-threads mt-2">
                <div v-for="thread in deadlockInfo.threads" :key="thread.id"
                     class="deadlock-thread-item">
                  <el-icon>
                    <Lock/>
                  </el-icon>
                  <span>线程 "{{ thread.name }}" (ID: {{
                      thread.id
                    }}) 被线程 ID: {{ thread.lockOwner }} 阻塞</span>
                </div>
              </div>
            </template>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="thread-list-card">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <el-icon class="mr-2">
              <List/>
            </el-icon>
            <span class="text-lg font-medium">线程列表</span>
          </div>
          <div class="search-box">
            <el-input
              v-model="searchKeyword"
              :prefix-icon="Search"
              clearable
              placeholder="搜索线程名称、ID或状态"
            />
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredThreads"
        :default-sort="{ prop: 'cpuUsage', order: 'descending' }"
        border
        style="width: 100%"
      >
        <el-table-column label="ID" prop="id" sortable width="80"/>
        <el-table-column label="线程名称" min-width="200" prop="name"/>
        <el-table-column label="状态" prop="state" width="120">
          <template #default="scope">
            <el-tag :type="threadStateMap[scope.row.state]?.type">
              {{ threadStateMap[scope.row.state]?.name || scope.row.state }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CPU使用率" prop="cpuUsage" sortable width="120">
          <template #default="scope">
            <div class="cpu-usage">
              <div :style="{ width: Math.min(scope.row.cpuUsage * 10, 100) + '%' }"
                   class="cpu-bar"></div>
              <span>{{ scope.row.cpuUsage.toFixed(1) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="运行时间" prop="time" sortable width="120">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column label="守护线程" prop="daemon" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.daemon ? 'info' : ''" size="small">
              {{ scope.row.daemon ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="150">
          <template #default="scope">
            <el-button
              plain
              size="small"
              type="primary"
              @click="viewThreadStack(scope.row)"
            >
              查看堆栈
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 线程堆栈对话框 -->
    <el-dialog
      v-model="threadStackVisible"
      :title="`线程堆栈: ${selectedThread?.name || ''} (ID: ${selectedThread?.id || ''})`"
      destroy-on-close
      width="60%"
    >
      <div v-if="selectedThread" class="thread-stack-dialog">
        <div class="thread-info mb-4">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="状态">
              <el-tag :type="threadStateMap[selectedThread.state]?.type">
                {{ threadStateMap[selectedThread.state]?.name || selectedThread.state }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">{{
                selectedThread.priority
              }}
            </el-descriptions-item>
            <el-descriptions-item label="守护线程">{{
                selectedThread.daemon ? '是' : '否'
              }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="stack-trace">
          <div class="stack-header">
            <h4>堆栈信息</h4>
            <el-button :icon="DocumentCopy" size="small" @click="copyStackTrace">
              复制堆栈
            </el-button>
          </div>

          <el-card class="stack-content">
            <pre><code v-for="(line, index) in selectedThread.stackTrace" :key="index">{{
                line
              }}</code></pre>
          </el-card>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.thread-analyzer-container {
  padding: 20px;

  .thread-overview-card {
    .thread-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .thread-stat-item {
        padding: 16px;
        border-radius: 8px;
        background-color: #f5f7fa;
        min-width: 100px;
        text-align: center;

        &.running {
          background-color: rgba(103, 194, 58, 0.1);
          border-left: 4px solid #67C23A;
        }

        &.waiting {
          background-color: rgba(230, 162, 60, 0.1);
          border-left: 4px solid #E6A23C;
        }

        &.blocked {
          background-color: rgba(245, 108, 108, 0.1);
          border-left: 4px solid #F56C6C;
        }

        &.timed-waiting {
          background-color: rgba(144, 147, 153, 0.1);
          border-left: 4px solid #909399;
        }

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #606266;
          font-size: 14px;
        }
      }
    }

    .thread-chart {
      height: 200px;
      width: 100%;

      .chart {
        height: 100%;
        width: 100%;
      }
    }
  }

  .deadlock-card {
    margin-bottom: 16px;

    .deadlock-threads {
      padding-left: 16px;

      .deadlock-thread-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }
    }
  }

  .thread-list-card {
    .search-box {
      width: 300px;
    }

    .cpu-usage {
      display: flex;
      align-items: center;
      gap: 8px;

      .cpu-bar {
        height: 8px;
        background-color: #67C23A;
        border-radius: 4px;
      }
    }
  }

  .thread-stack-dialog {
    .stack-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .stack-content {
      max-height: 400px;
      overflow-y: auto;

      pre {
        margin: 0;

        code {
          display: block;
          line-height: 1.6;
          font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
        }
      }
    }
  }
}
</style>
