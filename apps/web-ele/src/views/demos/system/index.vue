<template>
  <div class="system-monitor">
    <div class="monitor-header">
      <h2 class="monitor-title">系统监控中心</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" :loading="loading" circle type="primary"
                   @click="refreshData"></el-button>
      </div>
    </div>

    <!-- 功能切换 -->
    <el-tabs v-model="activeTab" class="monitor-tabs" type="border-card">
      <el-tab-pane label="资源监控" name="resource">
        <!-- 系统概览卡片 -->
        <el-row :gutter="20">
          <el-col :sm="12" :span="6" :xs="24">
            <div :style="{ background: 'var(--el-color-primary-light-7)' }" class="stat-card">
              <div class="stat-icon">
                <el-icon>
                  <cpu/>
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemInfo.cpuUsage }}%</div>
                <div class="stat-label">CPU使用率</div>
              </div>
              <div class="stat-progress">
                <el-progress :color="getProgressColor(systemInfo.cpuUsage)"
                             :percentage="systemInfo.cpuUsage" :show-text="false"
                             :stroke-width="4"/>
              </div>
            </div>
          </el-col>
          <el-col :sm="12" :span="6" :xs="24">
            <div :style="{ background: 'var(--el-color-success-light-7)' }" class="stat-card">
              <div class="stat-icon">
                <el-icon>
                  <memo/>
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemInfo.memoryUsage }}%</div>
                <div class="stat-label">内存使用率</div>
              </div>
              <div class="stat-progress">
                <el-progress :color="getProgressColor(systemInfo.memoryUsage)"
                             :percentage="systemInfo.memoryUsage" :show-text="false"
                             :stroke-width="4"/>
              </div>
            </div>
          </el-col>
          <el-col :sm="12" :span="6" :xs="24">
            <div :style="{ background: 'var(--el-color-warning-light-7)' }" class="stat-card">
              <div class="stat-icon">
                <el-icon>
                  <files/>
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemInfo.diskUsage }}%</div>
                <div class="stat-label">磁盘使用率</div>
              </div>
              <div class="stat-progress">
                <el-progress :color="getProgressColor(systemInfo.diskUsage)"
                             :percentage="systemInfo.diskUsage" :show-text="false"
                             :stroke-width="4"/>
              </div>
            </div>
          </el-col>
          <el-col :sm="12" :span="6" :xs="24">
            <div :style="{ background: 'var(--el-color-danger-light-7)' }" class="stat-card">
              <div class="stat-icon">
                <el-icon>
                  <data-line/>
                </el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ systemInfo.heapUsage }}%</div>
                <div class="stat-label">堆内存使用率</div>
              </div>
              <div class="stat-progress">
                <el-progress :color="getProgressColor(systemInfo.heapUsage)"
                             :percentage="systemInfo.heapUsage" :show-text="false"
                             :stroke-width="4"/>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- 图表区域 -->
        <el-row :gutter="20" class="chart-row">
          <!-- CPU使用率趋势图 -->
          <el-col :span="12" :xs="24">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>CPU使用率趋势</span>
                </div>
              </template>
              <EchartsUI ref="cpuChartRef" height="300px"/>
            </el-card>
          </el-col>

          <!-- 内存使用率趋势图 -->
          <el-col :span="12" :xs="24">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>内存使用率趋势</span>
                </div>
              </template>
              <EchartsUI ref="memoryChartRef" height="300px"/>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <!-- 系统信息 -->
          <el-col :span="12" :xs="24">
            <el-card class="info-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>系统信息</span>
                </div>
              </template>
              <div class="system-info-container">
                <div class="sys-section">
                  <div class="sys-section-title">
                    <el-icon>
                      <Monitor/>
                    </el-icon>
                    <span>基本信息</span>
                  </div>
                  <div class="sys-info-grid">
                    <div class="sys-info-item">
                      <div class="sys-info-icon">
                        <el-icon>
                          <Platform/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">操作系统</div>
                        <div class="sys-info-value">{{ systemInfo.osName }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon">
                        <el-icon>
                          <Cpu/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">系统架构</div>
                        <div class="sys-info-value">{{ systemInfo.osArch }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon">
                        <el-icon>
                          <Cpu/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">CPU核心数</div>
                        <div class="sys-info-value">{{ systemInfo.processors }} 核</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon">
                        <el-icon>
                          <Cpu/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">CPU型号</div>
                        <div class="sys-info-value">
                          {{ systemInfo.cpuModel || 'Intel(R) Core(TM) i7-10700K' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="sys-section">
                  <div class="sys-section-title">
                    <el-icon>
                      <Memo/>
                    </el-icon>
                    <span>内存信息</span>
                  </div>
                  <div class="sys-info-grid">
                    <div class="sys-info-item">
                      <div class="sys-info-icon memory-icon">
                        <el-icon>
                          <Memo/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">总内存</div>
                        <div class="sys-info-value">{{ formatBytes(systemInfo.totalMemory) }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon used-memory-icon">
                        <el-icon>
                          <Memo/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">已用内存</div>
                        <div class="sys-info-value">{{ formatBytes(systemInfo.usedMemory) }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon free-memory-icon">
                        <el-icon>
                          <Memo/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">可用内存</div>
                        <div class="sys-info-value">{{ formatBytes(systemInfo.freeMemory) }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon swap-icon">
                        <el-icon>
                          <DataLine/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">交换空间</div>
                        <div class="sys-info-value">
                          {{ formatBytes(systemInfo.swapSpace || 2 * 1024 * 1024 * 1024) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="sys-section">
                  <div class="sys-section-title">
                    <el-icon>
                      <Timer/>
                    </el-icon>
                    <span>时间信息</span>
                  </div>
                  <div class="sys-info-grid">
                    <div class="sys-info-item">
                      <div class="sys-info-icon time-icon">
                        <el-icon>
                          <Clock/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">系统时间</div>
                        <div class="sys-info-value">{{ systemInfo.currentTime }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon start-time-icon">
                        <el-icon>
                          <AlarmClock/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">启动时间</div>
                        <div class="sys-info-value">{{ systemInfo.startTime }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon uptime-icon">
                        <el-icon>
                          <Stopwatch/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">运行时长</div>
                        <div class="sys-info-value">{{ systemInfo.uptime }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon timezone-icon">
                        <el-icon>
                          <Clock/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">时区</div>
                        <div class="sys-info-value">
                          {{ systemInfo.timezone || 'Asia/Shanghai (GMT+8)' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="sys-section">
                  <div class="sys-section-title">
                    <el-icon>
                      <Connection/>
                    </el-icon>
                    <span>JVM信息</span>
                  </div>
                  <div class="sys-info-grid">
                    <div class="sys-info-item">
                      <div class="sys-info-icon jvm-icon">
                        <el-icon>
                          <Collection/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">JVM版本</div>
                        <div class="sys-info-value">{{ systemInfo.jvmVersion }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon java-home-icon">
                        <el-icon>
                          <HomeFilled/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">安装路径</div>
                        <div class="sys-info-value">{{ systemInfo.javaHome }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon jvm-args-icon">
                        <el-icon>
                          <Document/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">JVM参数</div>
                        <div class="sys-info-value">{{
                            systemInfo.jvmArgs || '-Xms256m -Xmx1024m'
                          }}
                        </div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon gc-icon">
                        <el-icon>
                          <Delete/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">GC策略</div>
                        <div class="sys-info-value">{{ systemInfo.gcPolicy || 'G1 GC' }}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="sys-section">
                  <div class="sys-section-title">
                    <el-icon>
                      <Files/>
                    </el-icon>
                    <span>磁盘信息</span>
                  </div>
                  <div class="sys-info-grid">
                    <div class="sys-info-item">
                      <div class="sys-info-icon disk-icon">
                        <el-icon>
                          <Files/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">总容量</div>
                        <div class="sys-info-value">{{ formatBytes(systemInfo.diskTotal) }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon disk-used-icon">
                        <el-icon>
                          <Files/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">已用空间</div>
                        <div class="sys-info-value">
                          {{ formatBytes(systemInfo.diskTotal - systemInfo.diskFree) }}
                        </div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon disk-free-icon">
                        <el-icon>
                          <Files/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">可用空间</div>
                        <div class="sys-info-value">{{ formatBytes(systemInfo.diskFree) }}</div>
                      </div>
                    </div>
                    <div class="sys-info-item">
                      <div class="sys-info-icon disk-usage-icon">
                        <el-icon>
                          <DataLine/>
                        </el-icon>
                      </div>
                      <div class="sys-info-content">
                        <div class="sys-info-label">使用率</div>
                        <div class="sys-info-value">{{ systemInfo.diskUsage }}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 内存分配 -->
          <el-col :span="12" :xs="24">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>内存分配</span>
                </div>
              </template>
              <EchartsUI ref="memoryPieRef" height="300px"/>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <!-- 堆内存图表 -->
          <el-col :span="24">
            <el-card class="chart-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>堆内存详情</span>
                </div>
              </template>
              <EchartsUI ref="heapChartRef" height="300px"/>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="JVM线程" name="thread">
        <div class="thread-monitor">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-card class="thread-stats-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>线程状态统计</span>
                    <el-button :icon="Search" size="small" type="primary" @click="fetchThreadStats">
                      统计线程
                    </el-button>
                  </div>
                </template>
                <div class="thread-stats">
                  <div v-for="(count, state) in threadStats" :key="state" class="thread-stat-item">
                    <div :class="`state-${state.toLowerCase()}`" class="thread-stat-circle">
                      {{ count }}
                    </div>
                    <div class="thread-stat-label">{{ getThreadStateName(state) }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20" class="chart-row">
            <el-col :span="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>线程状态分布</span>
                  </div>
                </template>
                <EchartsUI ref="threadStatePieRef" height="300px"/>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card class="chart-card" shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>线程数变化趋势</span>
                  </div>
                </template>
                <EchartsUI ref="threadTrendRef" height="300px"/>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-card shadow="hover">
                <template #header>
                  <div class="card-header">
                    <span>线程详情</span>
                    <div class="header-actions">
                      <el-input
                        v-model="threadSearchKey"
                        :prefix-icon="Search"
                        clearable
                        placeholder="搜索线程..."
                        style="width: 300px"
                      />
                    </div>
                  </div>
                </template>
                <el-table :data="filteredThreads" border max-height="500" stripe
                          style="width: 100%">
                  <el-table-column label="ID" prop="id" width="80"/>
                  <el-table-column label="线程名称" min-width="200" prop="name"
                                   show-overflow-tooltip/>
                  <el-table-column label="状态" prop="state" width="120">
                    <template #default="scope">
                      <el-tag :type="getThreadStateType(scope.row.state)">{{
                          scope.row.state
                        }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="优先级" prop="priority" width="100"/>
                  <el-table-column label="CPU时间" prop="cpuTime" width="120"/>
                  <el-table-column label="阻塞时间" prop="blockedTime" width="120"/>
                  <el-table-column label="操作" width="120">
                    <template #default="scope">
                      <el-button size="small" type="primary"
                                 @click="showThreadStacktrace(scope.row)">
                        堆栈
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 线程堆栈弹窗 -->
    <el-dialog
      v-model="stacktraceVisible"
      :close-on-click-modal="false"
      title="线程堆栈信息"
      width="60%"
    >
      <div v-if="currentThread">
        <div class="thread-dialog-header">
          <span>线程名称: {{ currentThread.name }}</span>
          <span>状态: <el-tag :type="getThreadStateType(currentThread.state)">{{
              currentThread.state
            }}</el-tag></span>
        </div>
        <el-divider/>
        <pre class="stacktrace-content">{{ currentThread.stackTrace }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {computed, onMounted, onUnmounted, reactive, ref} from 'vue';
import {
  AlarmClock,
  Clock,
  Collection,
  Connection,
  Cpu,
  DataLine,
  Delete,
  Document,
  Files,
  HomeFilled,
  Memo,
  Monitor,
  Platform,
  Refresh,
  Search,
  Stopwatch,
  Timer
} from '@element-plus/icons-vue';
import {EchartsUI, useEcharts} from '@vben/plugins/echarts';
import {getSystemInfo, getThreadStats} from "#/api/core/monitor.js";

// 激活的标签页
const activeTab = ref('resource');

const loading = ref(false);
const cpuData = reactive(Array(30).fill(0));
const memoryData = reactive(Array(30).fill(0));
const timeData = reactive(Array(30).fill(''));

// 图表引用
const cpuChartRef = ref(null);
const memoryChartRef = ref(null);
const memoryPieRef = ref(null);
const heapChartRef = ref(null);

// 使用echarts工具
const {renderEcharts: renderCpuChart} = useEcharts(cpuChartRef);
const {renderEcharts: renderMemoryChart} = useEcharts(memoryChartRef);
const {renderEcharts: renderMemoryPie} = useEcharts(memoryPieRef);
const {renderEcharts: renderHeapChart} = useEcharts(heapChartRef);

const systemInfo = ref({
  // CPU信息
  cpuUsage: 0,
  cpuModel: 'Intel(R) Core(TM) i7-10700K @ 3.80GHz',

  // 内存信息
  totalMemory: 0,
  usedMemory: 0,
  freeMemory: 0,
  memoryUsage: 0,
  swapSpace: 2 * 1024 * 1024 * 1024,

  // 磁盘信息
  diskUsage: 0,
  diskTotal: 500 * 1024 * 1024 * 1024,
  diskFree: 250 * 1024 * 1024 * 1024,

  // JVM信息
  jvmVersion: '',
  startTime: '',
  uptime: '',
  javaHome: '',
  jvmArgs: '-Xms256m -Xmx1024m',
  gcPolicy: 'G1 GC',

  // 堆内存信息
  heapInit: 0,
  heapMax: 0,
  heapUsed: 0,
  heapUsage: 0,

  // 系统信息
  osName: '',
  osArch: '',
  processors: 0,
  currentTime: '',
  timezone: 'Asia/Shanghai (GMT+8)'
});

// 格式化字节数
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 60) return '#67C23A';
  if (percentage < 80) return '#E6A23C';
  return '#F56C6C';
};

// 更新CPU图表
const updateCpuChart = () => {
  // 获取当前时间
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

  // 更新数据数组
  cpuData.shift();
  cpuData.push(systemInfo.value.cpuUsage);

  timeData.shift();
  timeData.push(timeStr);

  renderCpuChart({
    grid: {
      top: 30,
      bottom: 30,
      left: '3%',
      right: '4%',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: 'CPU使用率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#5470c6'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(84, 112, 198, 0.8)'
              },
              {
                offset: 1,
                color: 'rgba(84, 112, 198, 0.1)'
              }
            ]
          }
        },
        data: cpuData
      }
    ]
  });
};

// 更新内存图表
const updateMemoryChart = () => {
  // 更新数据数组
  memoryData.shift();
  memoryData.push(systemInfo.value.memoryUsage);

  renderMemoryChart({
    grid: {
      top: 30,
      bottom: 30,
      left: '3%',
      right: '4%',
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitNumber: 5,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '内存使用率',
        type: 'line',
        smooth: true,
        symbol: 'none',
        sampling: 'average',
        itemStyle: {
          color: '#91cc75'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: 'rgba(145, 204, 117, 0.8)'
              },
              {
                offset: 1,
                color: 'rgba(145, 204, 117, 0.1)'
              }
            ]
          }
        },
        data: memoryData
      }
    ]
  });
};

// 更新内存分配饼图
const updateMemoryPie = () => {
  renderMemoryPie({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['已用内存', '可用内存']
    },
    series: [
      {
        name: '内存分配',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: systemInfo.value.usedMemory,
            name: '已用内存',
            itemStyle: {color: '#ee6666'}
          },
          {
            value: systemInfo.value.freeMemory,
            name: '可用内存',
            itemStyle: {color: '#91cc75'}
          }
        ]
      }
    ]
  });
};

// 更新堆内存图表
const updateHeapChart = () => {
  renderHeapChart({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function (params) {
        return `${params[0].name}<br/>${params[0].marker}${params[0].seriesName}: ${formatBytes(params[0].value)}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['初始堆大小', '已用堆大小', '最大堆大小']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: function (value) {
          return formatBytes(value);
        }
      }
    },
    series: [
      {
        name: '堆内存',
        type: 'bar',
        barWidth: '60%',
        data: [
          {
            value: systemInfo.value.heapInit,
            itemStyle: {color: '#5470c6'}
          },
          {
            value: systemInfo.value.heapUsed,
            itemStyle: {color: '#ee6666'}
          },
          {
            value: systemInfo.value.heapMax,
            itemStyle: {color: '#3ba272'}
          }
        ]
      }
    ]
  });
};

// 刷新数据
const refreshData = async () => {
  loading.value = true;
  try {
    // 计算使用率
    // systemInfo.value.memoryUsage = Math.floor((systemInfo.value.usedMemory / systemInfo.value.totalMemory) * 100);
    // systemInfo.value.heapUsage = Math.floor((systemInfo.value.heapUsed / systemInfo.value.heapMax) * 100);
    // systemInfo.value.freeMemory = systemInfo.value.totalMemory - systemInfo.value.usedMemory;
    systemInfo.value = await getSystemInfo()

    // 更新图表
    updateCpuChart();
    updateMemoryChart();
    updateMemoryPie();
    updateHeapChart();
  } catch (error) {
    console.error('获取系统信息失败:', error);
  } finally {
    loading.value = false;
  }
};

// 定时刷新
let timer = null;

onMounted(() => {
  refreshData();
  // 每5秒刷新一次数据
  timer = setInterval(refreshData, 5000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});

// 线程相关
const threadSearchKey = ref('');
const threadStatePieRef = ref(null);
const threadTrendRef = ref(null);
const {renderEcharts: renderThreadStatePie} = useEcharts(threadStatePieRef);
const {renderEcharts: renderThreadTrend} = useEcharts(threadTrendRef);

// 线程状态统计
const threadStats = reactive({
  RUNNABLE: 12,
  BLOCKED: 2,
  WAITING: 6,
  TIMED_WAITING: 5,
  NEW: 0,
  TERMINATED: 1
});

// 线程变化趋势数据
const threadTrendData = reactive({
  times: [],
  runnable: [],
  blocked: [],
  waiting: [],
  timedWaiting: []
});

// 线程列表
const threads = reactive([
  {
    id: 1,
    name: 'main',
    state: 'RUNNABLE',
    priority: 5,
    cpuTime: '00:15:20',
    blockedTime: '00:00:00',
    stackTrace: 'java.lang.Thread.getStackTrace(Thread.java:1559)\njava.lang.Thread.getAllStackTraces(Thread.java:1629)\ncom.example.Application.main(Application.java:31)'
  },
  {
    id: 2,
    name: 'GC Thread',
    state: 'RUNNABLE',
    priority: 5,
    cpuTime: '00:02:15',
    blockedTime: '00:00:00',
    stackTrace: 'java.lang.Thread.getStackTrace(Thread.java:1559)\njava.lang.Thread.getAllStackTraces(Thread.java:1629)'
  },
  {
    id: 3,
    name: 'Finalizer',
    state: 'WAITING',
    priority: 8,
    cpuTime: '00:00:45',
    blockedTime: '00:00:00',
    stackTrace: 'java.lang.Object.wait(Native Method)\njava.lang.ref.ReferenceQueue.remove(ReferenceQueue.java:143)\njava.lang.ref.ReferenceQueue.remove(ReferenceQueue.java:164)\njava.lang.ref.Finalizer$FinalizerThread.run(Finalizer.java:188)'
  },
  {
    id: 4,
    name: 'Thread-Worker-1',
    state: 'TIMED_WAITING',
    priority: 5,
    cpuTime: '00:01:30',
    blockedTime: '00:00:12',
    stackTrace: 'java.lang.Thread.sleep(Native Method)\ncom.example.worker.WorkerThread.run(WorkerThread.java:87)'
  },
  {
    id: 5,
    name: 'Thread-Worker-2',
    state: 'RUNNABLE',
    priority: 5,
    cpuTime: '00:01:12',
    blockedTime: '00:00:05',
    stackTrace: 'sun.nio.ch.EPollArrayWrapper.epollWait(Native Method)\nsun.nio.ch.EPollArrayWrapper.poll(EPollArrayWrapper.java:269)\nsun.nio.ch.EPollSelectorImpl.doSelect(EPollSelectorImpl.java:93)\nsun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:86)'
  },
  {
    id: 6,
    name: 'Thread-Worker-3',
    state: 'BLOCKED',
    priority: 5,
    cpuTime: '00:00:52',
    blockedTime: '00:01:30',
    stackTrace: 'java.lang.Thread.getStackTrace(Thread.java:1559)\njava.util.concurrent.locks.LockSupport.park(LockSupport.java:175)\njava.util.concurrent.locks.AbstractQueuedSynchronizer.parkAndCheckInterrupt(AbstractQueuedSynchronizer.java:836)'
  },
  {
    id: 7,
    name: 'RMI TCP Connection',
    state: 'RUNNABLE',
    priority: 5,
    cpuTime: '00:00:18',
    blockedTime: '00:00:00',
    stackTrace: 'java.net.SocketInputStream.socketRead0(Native Method)\njava.net.SocketInputStream.socketRead(SocketInputStream.java:116)\njava.net.SocketInputStream.read(SocketInputStream.java:171)'
  },
  {
    id: 8,
    name: 'JMX Server Thread',
    state: 'WAITING',
    priority: 5,
    cpuTime: '00:00:06',
    blockedTime: '00:00:00',
    stackTrace: 'java.lang.Thread.getStackTrace(Thread.java:1559)\njava.util.concurrent.FutureTask.awaitDone(FutureTask.java:426)\njava.util.concurrent.FutureTask.get(FutureTask.java:204)'
  },
]);

// 线程堆栈弹窗
const stacktraceVisible = ref(false);
const currentThread = ref(null);

// 过滤后的线程列表
const filteredThreads = computed(() => {
  if (!threadSearchKey.value) return threads;
  return threads.filter(t =>
    t.name.toLowerCase().includes(threadSearchKey.value.toLowerCase()) ||
    t.state.toLowerCase().includes(threadSearchKey.value.toLowerCase())
  );
});

// 获取线程状态名称
const getThreadStateName = (state) => {
  const names = {
    'RUNNABLE': '运行中',
    'BLOCKED': '阻塞',
    'WAITING': '等待',
    'TIMED_WAITING': '计时等待',
    'NEW': '新建',
    'TERMINATED': '终止'
  };
  return names[state] || state;
};

// 获取线程状态对应的Tag类型
const getThreadStateType = (state) => {
  const types = {
    'RUNNABLE': 'success',
    'BLOCKED': 'danger',
    'WAITING': 'warning',
    'TIMED_WAITING': 'info',
    'NEW': '',
    'TERMINATED': 'info'
  };
  return types[state] || '';
};

// 显示线程堆栈
const showThreadStacktrace = (thread) => {
  currentThread.value = thread;
  stacktraceVisible.value = true;
};

// 获取线程统计
const fetchThreadStats = async () => {

  try {
    // 获取线程统计信息

    const data = await getThreadStats();

    // 更新线程状态统计
    threadStats.RUNNABLE = data.threadCounts.RUNNABLE || 0;
    threadStats.BLOCKED = data.threadCounts.BLOCKED || 0;
    threadStats.WAITING = data.threadCounts.WAITING || 0;
    threadStats.TIMED_WAITING = data.threadCounts.TIMED_WAITING || 0;
    threadStats.NEW = data.threadCounts.NEW || 0;
    threadStats.TERMINATED = data.threadCounts.TERMINATED || 0;

    // 更新时间序列数据
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    threadTrendData.times.push(timeStr);
    if (threadTrendData.times.length > 10) {
      threadTrendData.times.shift();
    }

    threadTrendData.runnable.push(threadStats.RUNNABLE);
    threadTrendData.blocked.push(threadStats.BLOCKED);
    threadTrendData.waiting.push(threadStats.WAITING);
    threadTrendData.timedWaiting.push(threadStats.TIMED_WAITING);

    if (threadTrendData.runnable.length > 10) {
      threadTrendData.runnable.shift();
      threadTrendData.blocked.shift();
      threadTrendData.waiting.shift();
      threadTrendData.timedWaiting.shift();
    }

    // 更新饼图和趋势图
    updateThreadStatePie();
    updateThreadTrend();
  } catch (error) {
    console.error('获取线程统计信息失败:', error);
  }
};

// 更新线程状态饼图
const updateThreadStatePie = () => {
  renderThreadStatePie({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['运行中', '阻塞', '等待', '计时等待', '新建', '终止']
    },
    series: [
      {
        name: '线程状态',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: threadStats.RUNNABLE,
            name: '运行中',
            itemStyle: {color: '#67C23A'}
          },
          {
            value: threadStats.BLOCKED,
            name: '阻塞',
            itemStyle: {color: '#F56C6C'}
          },
          {
            value: threadStats.WAITING,
            name: '等待',
            itemStyle: {color: '#E6A23C'}
          },
          {
            value: threadStats.TIMED_WAITING,
            name: '计时等待',
            itemStyle: {color: '#409EFF'}
          },
          {
            value: threadStats.NEW,
            name: '新建',
            itemStyle: {color: '#909399'}
          },
          {
            value: threadStats.TERMINATED,
            name: '终止',
            itemStyle: {color: '#B0C4DE'}
          }
        ]
      }
    ]
  });
};

// 更新线程趋势图
const updateThreadTrend = () => {
  renderThreadTrend({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['运行中', '阻塞', '等待', '计时等待']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: threadTrendData.times
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '运行中',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: threadTrendData.runnable,
        itemStyle: {color: '#67C23A'}
      },
      {
        name: '阻塞',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: threadTrendData.blocked,
        itemStyle: {color: '#F56C6C'}
      },
      {
        name: '等待',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: threadTrendData.waiting,
        itemStyle: {color: '#E6A23C'}
      },
      {
        name: '计时等待',
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: threadTrendData.timedWaiting,
        itemStyle: {color: '#409EFF'}
      }
    ]
  });
};
</script>

<style scoped>
.system-monitor {
  padding: 20px;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid var(--el-border-color-light);
}

.monitor-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: var(--el-color-primary);
  position: relative;
}

.monitor-title::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -15px;
  width: 40px;
  height: 4px;
  background-color: var(--el-color-primary);
  border-radius: 2px;
}

.stat-card {
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 25px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  height: 160px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 38px;
  opacity: 0.8;
}

.stat-info {
  position: relative;
  z-index: 1;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-value {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--el-color-info-dark-2);
}

.stat-label {
  font-size: 18px;
  font-weight: 500;
  color: var(--el-color-info-dark-2);
}

.stat-progress {
  margin-top: auto;
}

.chart-row {
  margin-bottom: 25px;
}

.chart-card,
.info-card {
  height: 100%;
  margin-bottom: 25px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.chart-card:hover,
.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}

.card-header span {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 系统信息部分样式 */
.system-info-container {
  padding: 15px;
}

.sys-section {
  margin-bottom: 25px;
  border-radius: 12px;
  background-color: var(--el-bg-color-page);
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.sys-section:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.sys-section-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  color: var(--el-color-primary);
}

.sys-section-title .el-icon {
  margin-right: 10px;
  font-size: 22px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sys-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.sys-info-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  transition: all 0.3s;
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sys-info-item:hover {
  background-color: var(--el-fill-color-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sys-info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background-color: var(--el-color-primary-light-9);
  margin-right: 15px;
}

.sys-info-icon .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

/* 自定义图标颜色 */
.memory-icon {
  background-color: var(--el-color-success-light-9);
}

.memory-icon .el-icon {
  color: var(--el-color-success);
}

.used-memory-icon {
  background-color: var(--el-color-warning-light-9);
}

.used-memory-icon .el-icon {
  color: var(--el-color-warning);
}

.free-memory-icon {
  background-color: var(--el-color-success-light-9);
}

.free-memory-icon .el-icon {
  color: var(--el-color-success);
}

.swap-icon {
  background-color: var(--el-color-info-light-9);
}

.swap-icon .el-icon {
  color: var(--el-color-info);
}

.time-icon, .timezone-icon {
  background-color: var(--el-color-primary-light-9);
}

.time-icon .el-icon, .timezone-icon .el-icon {
  color: var(--el-color-primary);
}

.start-time-icon {
  background-color: var(--el-color-warning-light-9);
}

.start-time-icon .el-icon {
  color: var(--el-color-warning);
}

.uptime-icon {
  background-color: var(--el-color-success-light-9);
}

.uptime-icon .el-icon {
  color: var(--el-color-success);
}

.jvm-icon, .java-home-icon, .jvm-args-icon, .gc-icon {
  background-color: var(--el-color-danger-light-9);
}

.jvm-icon .el-icon, .java-home-icon .el-icon, .jvm-args-icon .el-icon, .gc-icon .el-icon {
  color: var(--el-color-danger);
}

.disk-icon, .disk-free-icon {
  background-color: var(--el-color-success-light-9);
}

.disk-icon .el-icon, .disk-free-icon .el-icon {
  color: var(--el-color-success);
}

.disk-used-icon, .disk-usage-icon {
  background-color: var(--el-color-warning-light-9);
}

.disk-used-icon .el-icon, .disk-usage-icon .el-icon {
  color: var(--el-color-warning);
}

.sys-info-content {
  flex: 1;
}

.sys-info-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.sys-info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

@media (max-width: 768px) {
  .sys-info-grid {
    grid-template-columns: 1fr;
  }
}

.monitor-tabs {
  margin-bottom: 25px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.monitor-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
  background-color: var(--el-bg-color);
}

.monitor-tabs :deep(.el-tabs__nav) {
  border: none;
}

.monitor-tabs :deep(.el-tabs__item) {
  font-size: 16px;
  padding: 15px 25px;
  height: auto;
  transition: all 0.3s;
}

.monitor-tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.monitor-tabs :deep(.el-tabs__content) {
  padding: 20px;
}

.thread-monitor {
  padding: 10px;
}

.thread-stats-card {
  margin-bottom: 25px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.thread-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 35px;
  justify-content: space-around;
  padding: 20px;
}

.thread-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s;
}

.thread-stat-item:hover {
  transform: translateY(-5px);
}

.thread-stat-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  font-size: 26px;
  font-weight: bold;
  color: white;
  margin-bottom: 15px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.state-runnable {
  background-color: #67C23A;
}

.state-blocked {
  background-color: #F56C6C;
}

.state-waiting {
  background-color: #E6A23C;
}

.state-timed_waiting {
  background-color: #409EFF;
}

.state-new {
  background-color: #909399;
}

.state-terminated {
  background-color: #B0C4DE;
}

.thread-stat-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.thread-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
}

.stacktrace-content {
  background-color: var(--el-bg-color-page);
  padding: 20px;
  border-radius: 8px;
  max-height: 450px;
  overflow: auto;
  font-family: monospace;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  border: 1px solid var(--el-border-color);
}

/* 移除旧样式 */
.sys-section .sys-item-list,
.sys-section .sys-item,
.sys-section .sys-item-icon,
.sys-section .sys-item-content,
.sys-section .sys-item-label,
.sys-section .sys-item-value {
  display: none;
}
</style>
