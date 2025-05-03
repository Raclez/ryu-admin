<script setup>
import {ref, reactive, onMounted, onBeforeUnmount} from 'vue';
import axios from 'axios';
import {ElMessage} from 'element-plus';
import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import {
  DocumentCopy,
  Monitor,
  Connection,
  Cpu,
  Download,
  Document,
  Search,
  Refresh,
  Setting,
  List,
  ArrowDown
} from '@element-plus/icons-vue';

// Arthas命令列表
const commandGroups = reactive([
  {
    title: '基础命令',
    commands: [
      {name: 'help', desc: '查看命令帮助信息'},
      {name: 'cls', desc: '清空当前屏幕'},
      {name: 'session', desc: '查看当前会话信息'},
      {name: 'reset', desc: '重置增强类'},
      {name: 'version', desc: '查看Arthas版本号'},
      {name: 'quit', desc: '退出Arthas客户端'},
      {name: 'stop', desc: '关闭Arthas服务端'},
    ]
  },
  {
    title: '监控命令',
    commands: [
      {name: 'dashboard', desc: '系统实时数据面板'},
      {name: 'thread', desc: '查看线程堆栈信息'},
      {name: 'jvm', desc: '查看JVM信息'},
      {name: 'sysprop', desc: '查看JVM系统属性'},
      {name: 'sysenv', desc: '查看JVM环境变量'},
    ]
  },
  {
    title: '类命令',
    commands: [
      {name: 'sc', desc: '查看已加载的类信息'},
      {name: 'sm', desc: '查看已加载类的方法信息'},
      {name: 'jad', desc: '反编译指定已加载类的源码'},
      {name: 'mc', desc: '内存编译器'},
      {name: 'classloader', desc: '查看类加载器信息'},
    ]
  },
  {
    title: '增强命令',
    commands: [
      {name: 'watch', desc: '观察方法调用情况'},
      {name: 'trace', desc: '方法内部调用路径和耗时统计'},
      {name: 'stack', desc: '输出当前方法被调用的路径'},
      {name: 'tt', desc: '方法执行数据的时空隧道'},
      {name: 'monitor', desc: '方法执行监控'},
      {name: 'profiler', desc: '生成火焰图'},
    ]
  }
]);

// Arthas连接状态
const connectionStatus = ref('未连接');
const isConnected = ref(false);
const jvmPids = ref([]);
const selectedPid = ref('');
const loading = ref(false);
const connectError = ref('');

// 终端相关
const terminalContainer = ref(null);
const terminal = ref(null);
const commandHistory = ref([]);
const currentHistoryIndex = ref(-1);
const commandInput = ref('');

// 当前选中的实例信息
const currentInstance = reactive({
  host: 'localhost',
  port: 3658,
  pid: '',
  appName: '',
  startTime: '',
  status: 'running'
});

// 初始化终端
const initTerminal = () => {
  if (!terminalContainer.value) return;

  terminal.value = new Terminal({
    cursorBlink: true,
    theme: {
      background: '#1e1e1e',
      foreground: '#f0f0f0',
    },
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    scrollback: 1000,
    cols: 100,
    rows: 30
  });

  const fitAddon = new FitAddon();
  terminal.value.loadAddon(fitAddon);
  terminal.value.open(terminalContainer.value);
  fitAddon.fit();

  terminal.value.writeln('\x1b[1;34m欢迎使用 Arthas 控制台\x1b[0m');
  terminal.value.writeln('输入命令或从左侧选择命令来执行，按 Enter 发送');
  terminal.value.writeln('');
  terminal.value.write('\x1b[33marthas>\x1b[0m ');

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    fitAddon.fit();
  });

  // 监听终端输入
  let currentCommand = '';
  terminal.value.onKey(({key, domEvent}) => {
    const code = domEvent.keyCode;

    // Enter键：执行命令
    if (code === 13) {
      terminal.value.writeln('');
      if (currentCommand.trim()) {
        executeCommand(currentCommand);
        commandHistory.value.push(currentCommand);
        currentHistoryIndex.value = commandHistory.value.length;
      }
      currentCommand = '';
      terminal.value.write('\x1b[33marthas>\x1b[0m ');
    }
    // 退格键：删除字符
    else if (code === 8) {
      if (currentCommand.length > 0) {
        currentCommand = currentCommand.slice(0, -1);
        terminal.value.write('\b \b');
      }
    }
    // 上箭头：历史命令
    else if (code === 38) {
      if (currentHistoryIndex.value > 0) {
        currentHistoryIndex.value--;
        currentCommand = commandHistory.value[currentHistoryIndex.value];
        clearCurrentLine();
        terminal.value.write(currentCommand);
      }
    }
    // 下箭头：历史命令
    else if (code === 40) {
      if (currentHistoryIndex.value < commandHistory.value.length - 1) {
        currentHistoryIndex.value++;
        currentCommand = commandHistory.value[currentHistoryIndex.value];
        clearCurrentLine();
        terminal.value.write(currentCommand);
      } else {
        currentHistoryIndex.value = commandHistory.value.length;
        currentCommand = '';
        clearCurrentLine();
      }
    }
    // 其他按键：添加到命令
    else {
      currentCommand += key;
      terminal.value.write(key);
    }
  });
};

// 清除当前行
const clearCurrentLine = () => {
  terminal.value.write('\r\x1b[K\x1b[33marthas>\x1b[0m ');
};

// 执行命令并在终端显示结果
const executeCommand = (cmd) => {
  if (!isConnected.value) {
    terminal.value.writeln('\x1b[31m未连接到任何Arthas实例，请先连接\x1b[0m');
    return;
  }

  terminal.value.writeln(`\x1b[36m执行命令: ${cmd}\x1b[0m`);

  // 模拟命令结果（实际项目中应该通过API与后端交互）
  if (cmd === 'help') {
    terminal.value.writeln('\x1b[32mArthas 命令帮助信息:\x1b[0m');
    terminal.value.writeln('- dashboard: 系统状态面板');
    terminal.value.writeln('- thread: 查看线程信息');
    terminal.value.writeln('- jvm: 查看JVM信息');
    terminal.value.writeln('- sc: 查看类信息');
    terminal.value.writeln('- sm: 查看方法信息');
    terminal.value.writeln('更多命令请访问: https://arthas.aliyun.com/doc/commands.html');
  } else if (cmd === 'cls') {
    terminal.value.clear();
  } else if (cmd === 'dashboard') {
    terminal.value.writeln('\x1b[32m系统状态面板:\x1b[0m');
    terminal.value.writeln('ID      NAME                     GROUP            STATE           %CPU           INTERRUPTED    DAEMON');
    terminal.value.writeln('1       main                     main             RUNNABLE        0.0            false          false');
    terminal.value.writeln('2       Reference Handler        system           WAITING         0.0            false          true');
    terminal.value.writeln('3       Finalizer                system           WAITING         0.0            false          true');
    terminal.value.writeln('...');
    terminal.value.writeln('\x1b[32m内存信息:\x1b[0m');
    terminal.value.writeln('heap: 1234M/2048M  nonheap: 234M/512M');
  } else if (cmd.startsWith('thread')) {
    terminal.value.writeln('\x1b[32m线程信息:\x1b[0m');
    terminal.value.writeln('ID      NAME                     GROUP            STATE           %CPU           INTERRUPTED    DAEMON');
    terminal.value.writeln('1       main                     main             RUNNABLE        0.0            false          false');
    terminal.value.writeln('2       Reference Handler        system           WAITING         0.0            false          true');
    terminal.value.writeln('3       Finalizer                system           WAITING         0.0            false          true');
  } else {
    terminal.value.writeln(`模拟执行结果: ${cmd}`);
    terminal.value.writeln('实际情况请连接到真实Arthas服务');
  }
};

// 更新刷新PID按钮
const refreshJvmList = async () => {
  loading.value = true;
  try {
    // 实际项目中应该调用后端API获取JVM进程列表
    // const response = await axios.get('/api/arthas/jvm-list');
    // jvmPids.value = response.data;

    // 临时模拟数据
    setTimeout(() => {
      jvmPids.value = [
        {pid: '12345', name: 'SpringBoot应用'},
        {pid: '23456', name: 'Tomcat服务器'},
        {pid: '34567', name: '微服务实例'},
        {pid: '45678', name: 'Dubbo服务'},
      ];
      loading.value = false;
    }, 1000);
  } catch (error) {
    console.error('获取JVM进程列表失败', error);
    ElMessage.error('获取JVM进程列表失败');
    loading.value = false;
  }
};

// 点击命令按钮执行
const runCommand = (cmd) => {
  if (!terminal.value) return;

  if (typeof cmd === 'string' && cmd.trim()) {
    // 先清除当前行
    clearCurrentLine();
    // 写入命令
    terminal.value.write(cmd);
    // 模拟回车键
    executeCommand(cmd);
    terminal.value.writeln('');
    terminal.value.write('\x1b[33marthas>\x1b[0m ');

    // 更新命令输入框
    commandInput.value = '';
  }
};

// 使用Element UI消息组件替代控制台日志
const showErrorMessage = (message) => {
  ElMessage.error(message);
};

// 更新连接代码
const connectToArthas = async () => {
  if (!selectedPid.value) {
    ElMessage.warning('请先选择一个Java进程');
    return;
  }

  loading.value = true;
  connectError.value = '';

  try {
    // 实际项目中应调用后端API建立连接
    // const response = await axios.post('/api/arthas/connect', {
    //   pid: selectedPid.value,
    //   host: currentInstance.host,
    //   port: currentInstance.port
    // });

    // 模拟连接过程
    setTimeout(() => {
      loading.value = false;
      isConnected.value = true;
      connectionStatus.value = '已连接';
      currentInstance.pid = selectedPid.value;
      currentInstance.appName = jvmPids.value.find(item => item.pid === selectedPid.value)?.name || `应用-${selectedPid.value}`;
      currentInstance.startTime = new Date().toLocaleString();

      // 初始化终端提示
      if (terminal.value) {
        terminal.value.clear();
        terminal.value.writeln('\x1b[1;32m✓ 已成功连接到 Arthas\x1b[0m');
        terminal.value.writeln(`\x1b[34m- 主机: ${currentInstance.host}\x1b[0m`);
        terminal.value.writeln(`\x1b[34m- 应用: ${currentInstance.appName}\x1b[0m`);
        terminal.value.writeln(`\x1b[34m- PID: ${currentInstance.pid}\x1b[0m`);
        terminal.value.writeln('');
        terminal.value.writeln('输入 help 查看可用命令');
        terminal.value.writeln('');
        terminal.value.write('\x1b[33marthas>\x1b[0m ');
      }

      ElMessage.success('已成功连接到Arthas');
    }, 1500);
  } catch (error) {
    console.error('连接Arthas失败', error);
    connectError.value = error.message || '连接失败，请检查服务是否可用';
    ElMessage.error(`连接失败: ${connectError.value}`);
    loading.value = false;
  }
};

// 修改断开连接逻辑
const disconnectArthas = async () => {
  try {
    // 实际项目中应调用后端API断开连接
    // await axios.post('/api/arthas/disconnect', {
    //   pid: currentInstance.pid
    // });

    isConnected.value = false;
    connectionStatus.value = '未连接';

    // 清理终端
    if (terminal.value) {
      terminal.value.clear();
      terminal.value.writeln('\x1b[1;31m已断开连接\x1b[0m');
      terminal.value.writeln('');
      terminal.value.write('\x1b[33marthas>\x1b[0m ');
    }

    ElMessage.success('已断开连接');
  } catch (error) {
    console.error('断开连接失败', error);
    ElMessage.error('断开连接失败');
  }
};

// 生命周期钩子
onMounted(() => {
  // 初始化终端
  initTerminal();

  // 加载JVM进程列表（模拟数据）
  jvmPids.value = [
    {pid: '12345', name: 'SpringBoot应用'},
    {pid: '23456', name: 'Tomcat服务器'},
    {pid: '34567', name: '微服务实例'}
  ];
});

// 组件卸载时清理资源
onBeforeUnmount(() => {
  // 清理终端
  if (terminal.value) {
    terminal.value.dispose();
  }

  // 清理窗口事件监听器
  window.removeEventListener('resize', () => {
  });
});
</script>

<template>
  <div class="arthas-console-container">
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card class="h-full">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">Arthas 控制台</span>
              <div>
                <el-tag v-if="isConnected" type="success">已连接</el-tag>
                <el-tag v-else type="info">未连接</el-tag>
              </div>
            </div>
          </template>

          <div class="connection-panel mb-4">
            <h3 class="text-lg font-medium mb-2">
              <el-icon>
                <Connection/>
              </el-icon>
              连接管理
            </h3>

            <el-form label-position="top" size="small">
              <el-form-item label="选择Java进程">
                <div class="flex items-center gap-2">
                  <el-select v-model="selectedPid" placeholder="选择进程" style="flex: 1">
                    <el-option
                      v-for="item in jvmPids"
                      :key="item.pid"
                      :label="`PID: ${item.pid} (${item.name})`"
                      :value="item.pid"
                    />
                  </el-select>
                  <el-button :icon="Refresh" :loading="loading" circle @click="refreshJvmList"/>
                </div>
              </el-form-item>

              <div class="flex justify-between gap-2 mb-4">
                <el-button
                  :disabled="!selectedPid || isConnected"
                  :loading="loading"
                  style="flex: 1"
                  type="primary"
                  @click="connectToArthas"
                >
                  连接
                </el-button>
                <el-button
                  :disabled="!isConnected"
                  style="flex: 1"
                  type="danger"
                  @click="disconnectArthas"
                >
                  断开
                </el-button>
              </div>

              <div v-if="connectError" class="text-red-500 text-sm mt-2">
                {{ connectError }}
              </div>
            </el-form>
          </div>

          <div v-if="isConnected" class="instance-info mb-4">
            <h3 class="text-lg font-medium mb-2">
              <el-icon>
                <Monitor/>
              </el-icon>
              实例信息
            </h3>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="主机">{{ currentInstance.host }}</el-descriptions-item>
              <el-descriptions-item label="端口">{{ currentInstance.port }}</el-descriptions-item>
              <el-descriptions-item label="PID">{{ currentInstance.pid }}</el-descriptions-item>
              <el-descriptions-item label="应用名">{{
                  currentInstance.appName
                }}
              </el-descriptions-item>
              <el-descriptions-item label="开始时间">{{
                  currentInstance.startTime
                }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag size="small" type="success">{{ currentInstance.status }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="commands-panel">
            <h3 class="text-lg font-medium mb-2">
              <el-icon>
                <List/>
              </el-icon>
              命令列表
            </h3>

            <el-collapse>
              <el-collapse-item v-for="(group, index) in commandGroups" :key="index"
                                :title="group.title">
                <el-scrollbar height="200px">
                  <div class="command-list">
                    <el-button
                      v-for="cmd in group.commands"
                      :key="cmd.name"
                      :disabled="!isConnected"
                      class="command-button"
                      size="small"
                      text
                      @click="runCommand(cmd.name)"
                    >
                      <span class="command-name">{{ cmd.name }}</span>
                      <span class="command-desc">{{ cmd.desc }}</span>
                    </el-button>
                  </div>
                </el-scrollbar>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-col>

      <el-col :span="18">
        <el-card class="h-full">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">终端</span>
              <div>
                <el-button :icon="DocumentCopy" size="small" @click="terminal?.clear()">
                  清空
                </el-button>
              </div>
            </div>
          </template>

          <div ref="terminalContainer" class="terminal-container"></div>

          <div class="command-input-area mt-4">
            <el-input
              v-model="commandInput"
              :disabled="!isConnected"
              clearable
              placeholder="输入Arthas命令，回车执行"
              @keyup.enter="runCommand(commandInput); commandInput = ''"
            >
              <template #append>
                <el-button :disabled="!isConnected"
                           @click="runCommand(commandInput); commandInput = ''">
                  执行
                </el-button>
              </template>
            </el-input>

            <div class="text-sm text-gray-500 mt-2">
              提示: 使用上下箭头导航历史命令，或从左侧选择命令
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.arthas-console-container {
  height: 100%;
  padding: 20px;
  background-color: var(--el-bg-color-page);

  .el-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--el-bg-color);

    :deep(.el-card__body) {
      flex: 1;
      overflow: auto;
    }
  }

  .terminal-container {
    height: calc(100vh - 280px);
    min-height: 400px;
    background-color: #1e1e1e;
    border-radius: 4px;
    padding: 4px;
    overflow: hidden;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  }

  .command-list {
    display: flex;
    flex-direction: column;
    width: 100%;

    .command-button {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      margin-bottom: 4px;
      text-align: left;
      border-radius: 4px;

      &:hover {
        background-color: var(--el-fill-color-light);
      }

      .command-name {
        font-weight: bold;
        font-family: 'Menlo', monospace;
        color: var(--el-color-primary);
      }

      .command-desc {
        color: var(--el-text-color-secondary);
        font-size: 12px;
      }
    }
  }
}
</style>
