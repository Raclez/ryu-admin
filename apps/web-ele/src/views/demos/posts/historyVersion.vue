<template>
  <div class="version-history-container">
    <el-card class="version-history-card">
      <template #header>
        <div class="card-header">
          <h2>{{ article.title }} - 版本历史</h2>
          <el-button type="primary" size="small" @click="backToArticle">
            返回文章
          </el-button>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="6" animated />
      </div>

      <div v-else-if="versionHistory.length === 0" class="empty-state">
        <el-empty description="暂无版本历史记录" />
      </div>

      <div v-else class="version-history-content">
        <el-timeline>
          <el-timeline-item
            v-for="(version, index) in versionHistory"
            :key="version.id"
            :timestamp="formatDate(version.createdAt)"
            :type="getTimelineItemType(index)"
            :color="getTimelineItemColor(index)"
          >
            <el-card class="version-card">
              <div class="version-header">
                <div class="version-info">
                  <h3>版本 {{ version.versionNumber }}</h3>
                  <div class="version-meta">
                    <span class="author">
                      <el-avatar :size="24" :src="version.author.avatar"></el-avatar>
                      {{ version.author.name }}
                    </span>
                    <el-tag size="small" :type="version.isPublished ? 'success' : 'info'">
                      {{ version.isPublished ? '已发布' : '草稿' }}
                    </el-tag>
                  </div>
                </div>
                <div class="version-actions">
                  <el-tooltip content="预览此版本" placement="top">
                    <el-button type="primary" plain size="small" circle @click="previewVersion(version)">
                      <el-icon><View /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="恢复此版本" placement="top">
                    <el-button
                      type="success"
                      plain
                      size="small"
                      circle
                      @click="restoreVersion(version)"
                      :disabled="index === 0"
                    >
                      <el-icon><RefreshRight /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="比较版本差异" placement="top">
                    <el-button
                      type="info"
                      plain
                      size="small"
                      circle
                      @click="openCompareDialog(version, index)"
                      :disabled="index === versionHistory.length - 1"
                    >
                      <el-icon><Document /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </div>

              <div class="version-description">
                <p>{{ version.description || '无版本说明' }}</p>
              </div>

              <div class="version-stats">
                <div class="stat-item">
                  <el-icon><Edit /></el-icon>
                  <span>{{ version.wordCount }} 字</span>
                </div>
                <div class="stat-item">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDuration(version.editDuration) }}</span>
                </div>
                <div class="stat-item">
                  <el-icon><Reading /></el-icon>
                  <span>预计阅读时间 {{ Math.ceil(version.wordCount / 300) }} 分钟</span>
                </div>
              </div>

              <div v-if="version.tags && version.tags.length > 0" class="version-tags">
                <el-tag
                  v-for="tag in version.tags"
                  :key="tag"
                  size="small"
                  effect="plain"
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>

    <!-- 重新设计的版本预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="版本预览"
      width="70%"
      :before-close="closePreviewDialog"
      top="5vh"
      fullscreen
      destroy-on-close
    >
      <div v-if="selectedVersion" class="preview-content">
        <div class="preview-header">
          <div class="preview-title">
            <h2>{{ article.title }}</h2>
            <div class="preview-subtitle">
              版本 {{ selectedVersion.versionNumber }} · {{ formatDate(selectedVersion.createdAt) }}
            </div>
          </div>
          <div class="preview-info">
            <div class="preview-author">
              <el-avatar :size="32" :src="selectedVersion.author.avatar"></el-avatar>
              <div class="author-details">
                <div class="author-name">{{ selectedVersion.author.name }}</div>
                <el-tag size="small" :type="selectedVersion.isPublished ? 'success' : 'info'">
                  {{ selectedVersion.isPublished ? '已发布' : '草稿' }}
                </el-tag>
              </div>
            </div>
            <div class="preview-stats">
              <div class="stat-badge">
                <el-icon><Edit /></el-icon>
                {{ selectedVersion.wordCount }} 字
              </div>
              <div class="stat-badge">
                <el-icon><Clock /></el-icon>
                {{ formatDuration(selectedVersion.editDuration) }}
              </div>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="preview-body markdown-body" v-html="selectedVersion.content"></div>
      </div>
    </el-dialog>

    <!-- 重新设计的版本比较对话框，类似IDEA历史记录对比 -->
    <el-dialog
      v-model="compareDialogVisible"
      title="版本对比"
      width="90%"
      :before-close="closeCompareDialog"
      top="5vh"
      fullscreen
      destroy-on-close
    >
      <div v-if="currentVersion && previousVersion" class="compare-content">
<!--        <div class="compare-header">-->
<!--          <div class="compare-controls">-->
<!--            <div class="diff-settings">-->
<!--              <el-checkbox v-model="showLineNumbers" @change="renderDiff">显示行号</el-checkbox>-->
<!--              <el-checkbox v-model="highlightChanges" @change="renderDiff">高亮显示变化</el-checkbox>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
        <DiffViewer
          :original="leftVersion?.content || ''"
          :modified="rightVersion?.content || ''"
        />

<!--        <div class="ide-diff-container">-->
<!--          <div class="diff-panels">-->
<!--            <div class="diff-panel left-panel">-->
<!--              <div class="panel-header">-->
<!--                <div class="panel-version">-->
<!--                  版本 {{ leftVersion?.versionNumber }}-->
<!--                </div>-->
<!--                <div class="panel-date">-->
<!--                  {{ formatDate(leftVersion?.createdAt) }}-->
<!--                </div>-->
<!--              </div>-->
<!--              <div class="panel-content" ref="leftPanel"></div>-->
<!--            </div>-->
<!--            <div class="diff-panel right-panel">-->
<!--              <div class="panel-header">-->
<!--                <div class="panel-version">-->
<!--                  版本 {{ rightVersion?.versionNumber }}-->
<!--                </div>-->
<!--                <div class="panel-date">-->
<!--                  {{ formatDate(rightVersion?.createdAt) }}-->
<!--                </div>-->
<!--              </div>-->
<!--              <div class="panel-content" ref="rightPanel"></div>-->
<!--            </div>-->
<!--          </div>-->

<!--          <div class="diff-summary">-->
<!--            <div class="summary-item added">-->
<!--              <div class="summary-icon"><el-icon><Plus /></el-icon></div>-->
<!--              <div class="summary-text">新增: {{ diffStats.added }} 行</div>-->
<!--            </div>-->
<!--            <div class="summary-item modified">-->
<!--              <div class="summary-icon"><el-icon><Edit /></el-icon></div>-->
<!--              <div class="summary-text">修改: {{ diffStats.modified }} 行</div>-->
<!--            </div>-->
<!--            <div class="summary-item deleted">-->
<!--              <div class="summary-icon"><el-icon><Delete /></el-icon></div>-->
<!--              <div class="summary-text">删除: {{ diffStats.deleted }} 行</div>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
      </div>
    </el-dialog>

    <!-- 恢复版本确认 -->
    <el-dialog
      v-model="restoreDialogVisible"
      title="恢复版本确认"
      width="30%"
    >
      <div class="restore-confirm-content">
        <el-alert
          title="确认恢复版本"
          type="warning"
          :closable="false"
          show-icon
        >
          <p>您即将恢复到版本 {{ selectedVersion?.versionNumber }} ({{ formatDate(selectedVersion?.createdAt) }})。</p>
          <p>此操作将创建一个新的版本，内容将恢复到所选版本。</p>
        </el-alert>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="restoreDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRestoreVersion">
            确认恢复
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { View, RefreshRight, Document, Edit, Clock, Reading, Plus, Delete } from '@element-plus/icons-vue';
import DiffViewer from "#/components/DiffViewer.vue";
// import MonacoEditor from "#/components/MonacoEditor.vue";

// 路由相关
const route = useRoute();
const router = useRouter();
const articleId = route.params.id;

// 数据状态
const loading = ref(true);
const article = ref({ title: '加载中...' });
const versionHistory = ref([]);

// 对话框状态
const previewDialogVisible = ref(false);
const compareDialogVisible = ref(false);
const restoreDialogVisible = ref(false);

// 版本相关
const selectedVersion = ref(null);
const currentVersion = ref(null);
const previousVersion = ref(null);

// 比较相关
const leftVersionId = ref(null);
const rightVersionId = ref(null);
const leftPanel = ref(null);
const rightPanel = ref(null);
const showLineNumbers = ref(true);
const highlightChanges = ref(true);
const diffStats = ref({
  added: 0,
  modified: 0,
  deleted: 0
});

// 计算属性 - 根据ID获取左右版本
const leftVersion = computed(() => {
  return versionHistory.value.find(v => v.id === leftVersionId.value) || null;
});

const rightVersion = computed(() => {
  return versionHistory.value.find(v => v.id === rightVersionId.value) || null;
});

// 模拟获取文章信息和版本历史数据
const fetchArticleData = async () => {
  loading.value = true;
  try {
    // 这里应该是实际的API调用
    // const response = await api.getArticle(articleId);
    // article.value = response.data;

    // 模拟数据
    setTimeout(() => {
      article.value = {
        id: articleId,
        title: '如何使用Vue3和Element Plus构建现代化Web应用',
        author: {
          id: 1,
          name: '张三',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
        }
      };

      versionHistory.value = [
        {
          id: 1,
          versionNumber: 3.0,
          articleId: articleId,
          createdAt: new Date(2024, 2, 1, 14, 30),
          author: {
            id: 1,
            name: '张三',
            avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
          },
          isPublished: true,
          description: '增加了更多示例和修复了格式问题',
          content: `## 脚手架文件结构

\`\`\`lua
├─ node_modules
├─ public
│  ├─ favicon.ico: 页签图标
│  └─ index.html: 主页面
├─ src
│  ├─ assets: 存放静态资源
│  │  └─ logo.png
│  ├─ component: 存放组件
│  │  └─ HelloWorld.vue
│  ├─ App.vue: 汇总所有组件
│  └─ main.js: 入口文件
├─ .gitignore: git版本管制忽略的配置
├─ babel.config.js: babel的配置文件
├─ package.json: 应用包配置文件
├─ README.md: 应用描述文件
└─ package-lock.json: 包版本控制文件
\`\`\`
`,
          wordCount: 1500,
          editDuration: 7800, // 秒
          tags: ['最终版', '已发布']
        },
        {
          id: 2,
          versionNumber: 2.0,
          articleId: articleId,
          createdAt: new Date(2024, 1, 28, 10, 15),
          author: {
            id: 1,
            name: '张三',
            avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
          },
          isPublished: false,
          description: '完成主要内容编写，添加了代码示例',
          content: `## ccc脚手架文件结构
          #### 你在干嘛

\`\`\`lua
├─ node_modules
├─ public
│  ├─ favicon.ico: 页签图标
│  └─ index.html: 主页面
├─ src
│  ├─ assets: 存静态资源
│  │  └─ logo.png
│  ├─ component: 存放组件
│  │  └─ HelloWorld.vue
│  ├─ App.vue: 汇总所有组件
│  └─ main.js: 入口文件
├─ .gitignore: git版本管制忽略的配置
├─ babel.config.js: babel的配置文件
├─ package.json: 应用包配置文件
├─ README.md: 应用描述文件
└─ package-lock.json: 包版本控制文件
\`\`\`
`,
          wordCount: 1350,
          editDuration: 5400,
          tags: ['草稿', '审阅中']
        },
        {
          id: 3,
          versionNumber: 1.0,
          articleId: articleId,
          createdAt: new Date(2024, 1, 25, 16, 45),
          author: {
            id: 1,
            name: '张三',
            avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
          },
          isPublished: false,
          description: '初始草稿，文章结构和大纲',
          content:  `## 脚手架文件结构
\`\`\`lua
├─ node_modules
├─ public
│  ├─ favicon.ico: 页签图标
│  └─ index.html: 主页面
├─ src
│  ├─ assets: 存放静态资源
│  │  └─ logo.png
│  ├─ component: 存放组件
│  │  └─ HelloWorld.vue
│  ├─ App.vue: 汇总所有组件
│  └─ main.js: 入口文件
├─ .gitignore: git版本管制忽略的配置
├─ babel.config.js: babel的配置文件
├─ package.json: 应用包配置文件
├─ README.md: 应用描述文件
└─ package-lock.json: 包版本控制文件
\`\`\`
`,
          wordCount: 500,
          editDuration: 3600,
          tags: ['草稿', '初稿']
        }
      ];

      loading.value = false;
    }, 800);
  } catch (error) {
    console.error('获取文章数据失败:', error);
    ElMessage.error('获取文章数据失败');
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// 格式化时长
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  let result = '';
  if (hours > 0) {
    result += `${hours}小时`;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes}分钟`;
  }
  return result;
};

// 获取时间线项目类型
const getTimelineItemType = (index) => {
  const types = ['success', 'warning', 'info'];
  return index < types.length ? types[index] : 'info';
};

// 获取时间线项目颜色
const getTimelineItemColor = (index) => {
  if (index === 0) return '#67C23A'; // 最新版本绿色
  if (index === 1) return '#E6A23C'; // 第二新版本黄色
  return '#909399'; // 其他版本灰色
};

// 预览版本
const previewVersion = (version) => {
  selectedVersion.value = version;
  previewDialogVisible.value = true;
};

// 关闭预览对话框
const closePreviewDialog = () => {
  previewDialogVisible.value = false;
  selectedVersion.value = null;
};

// 打开比较对话框
const openCompareDialog = (currentVer, index) => {
  if (index >= versionHistory.value.length - 1) {
    ElMessage.warning('没有更早的版本可比较');
    return;
  }

  currentVersion.value = currentVer;
  previousVersion.value = versionHistory.value[index + 1];

  // 设置初始版本ID用于选择器
  rightVersionId.value = currentVer.id;
  leftVersionId.value = previousVersion.value.id;

  compareDialogVisible.value = true;

  // // 在对话框打开后渲染差异
  // nextTick(() => {
  //   console.log("Dialog opened, Monaco will be rendered properly.");
  // });
};

// 更新比较的版本
const updateCompare = () => {

  currentVersion.value = versionHistory.value.find(v => v.id === rightVersionId.value);
  previousVersion.value = versionHistory.value.find(v => v.id === leftVersionId.value);
  // if (leftVersionId.value && rightVersionId.value) {
  //   currentVersion.value = versionHistory.value.find(v => v.id === rightVersionId.value);
  //   previousVersion.value = versionHistory.value.find(v => v.id === leftVersionId.value);
  //

  // nextTick(() => {
  //   console.log("Dialog opened, Monaco will be rendered properly.");
  // });
  // }
};

// 从HTML内容中提取纯文本
const extractTextContent = (html) => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

// 计算差异统计
const calculateDiffStats = (diff) => {
  let added = 0;
  let deleted = 0;
  let modified = 0;

  diff.forEach(part => {
    if (part.added) {
      added += part.value.split('\n').length - 1;
    } else if (part.removed) {
      deleted += part.value.split('\n').length - 1;
    }
  });

  // 修改的行数比较复杂，这里简化处理
  modified = Math.min(added, deleted);
  added = added - modified;
  deleted = deleted - modified;

  return { added, modified, deleted };
};

// 渲染差异
// const renderDiff = () => {
//   if (!leftPanel.value || !rightPanel.value || !leftVersion.value || !rightVersion.value) return;
//
//   const oldText = extractTextContent(leftVersion.value.content);
//   const newText = extractTextContent(rightVersion.value.content);
//
//   // 使用diff库计算差异
//   const diff = Diff.diffLines(oldText, newText);
//   diffStats.value = calculateDiffStats(diff);
//
//   // 生成左右面板的HTML
//   let leftHtml = '';
//   let rightHtml = '';
//
//   let lineNumberLeft = 1;
//   let lineNumberRight = 1;
//
//   diff.forEach(part => {
//     const lines = part.value.split('\n');
//     // 忽略最后一个空行
//     if (lines[lines.length - 1] === '') {
//       lines.pop();
//     }
//
//     lines.forEach(line => {
//       const escapedLine = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
//
//       if (!part.added) {
//         // 在左侧显示
//         const lineClass = part.removed && highlightChanges.value ? 'diff-line-removed' : '';
//         const lineNum = showLineNumbers.value ? `<span class="line-number">${lineNumberLeft}</span>` : '';
//         leftHtml += `<div class="diff-line ${lineClass}">${lineNum}<span class="line-content">${escapedLine || ' '}</span></div>`;
//         lineNumberLeft++;
//       }
//
//       if (!part.removed) {
//         // 在右侧显示
//         const lineClass = part.added && highlightChanges.value ? 'diff-line-added' : '';
//         const lineNum = showLineNumbers.value ? `<span class="line-number">${lineNumberRight}</span>` : '';
//         rightHtml += `<div class="diff-line ${lineClass}">${lineNum}<span class="line-content">${escapedLine || ' '}</span></div>`;
//         lineNumberRight++;
//       }
//     });
//   });
//
//   leftPanel.value.innerHTML = leftHtml || '<div class="empty-diff">无内容</div>';
//   rightPanel.value.innerHTML = rightHtml || '<div class="empty-diff">无内容</div>';
//
//   // 应用代码高亮（如果需要）
//   if (hljs) {
//     document.querySelectorAll('.line-content pre code').forEach((block) => {
//       hljs.highlightElement(block);
//     });
//   }
//
//   // 同步滚动处理
//   syncPanelScroll();
// };



function renderDiff() {
  // 获取两个版本的内容
  const leftContent = leftVersion.content;
  const rightContent = rightVersion.content;

  // 使用 diff 库比较内容差异 (假设你使用了如 diff 或 jsdiff 之类的库)
  const diffResult = computeDiff(leftContent, rightContent);

  // 清空面板内容
  leftPanelRef.value.innerHTML = '';
  rightPanelRef.value.innerHTML = '';

  let addedLines = 0;
  let deletedLines = 0;
  let modifiedLines = 0;

  // 渲染差异内容
  diffResult.forEach((part, index) => {
    const leftLineNumber = part.leftLineNumber;
    const rightLineNumber = part.rightLineNumber;

    // 处理左侧面板
    if (part.type !== 'add') {
      const leftLineDiv = document.createElement('div');
      leftLineDiv.className = 'diff-line';

      // 根据变更类型添加样式
      if (part.type === 'delete') {
        leftLineDiv.classList.add('diff-deleted');
        deletedLines++;
      } else if (part.type === 'modify') {
        leftLineDiv.classList.add('diff-modified');
        modifiedLines++;
      }

      // 如果当前行是上下文中应该高亮的行，添加高亮背景
      if (shouldHighlightLine(part, index, diffResult)) {
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'highlight-row';
        leftLineDiv.appendChild(highlightSpan);
      }

      // 添加行号
      if (showLineNumbers) {
        const lineNumberSpan = document.createElement('span');
        lineNumberSpan.className = 'line-number';
        lineNumberSpan.textContent = leftLineNumber;
        leftLineDiv.appendChild(lineNumberSpan);
      }

      // 添加行内容，并处理词级别的差异高亮
      const lineContentDiv = document.createElement('div');
      lineContentDiv.className = 'line-content';

      if (part.type === 'modify' && highlightChanges) {
        lineContentDiv.innerHTML = highlightWordDifferences(part.leftContent, 'deleted');
      } else {
        lineContentDiv.textContent = part.leftContent;
      }

      leftLineDiv.appendChild(lineContentDiv);
      leftPanelRef.value.appendChild(leftLineDiv);
    }

    // 处理右侧面板
    if (part.type !== 'delete') {
      const rightLineDiv = document.createElement('div');
      rightLineDiv.className = 'diff-line';

      // 根据变更类型添加样式
      if (part.type === 'add') {
        rightLineDiv.classList.add('diff-added');
        addedLines++;
      } else if (part.type === 'modify') {
        rightLineDiv.classList.add('diff-modified');
      }

      // 如果当前行是上下文中应该高亮的行，添加高亮背景
      if (shouldHighlightLine(part, index, diffResult)) {
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'highlight-row';
        rightLineDiv.appendChild(highlightSpan);
      }

      // 添加行号
      if (showLineNumbers) {
        const lineNumberSpan = document.createElement('span');
        lineNumberSpan.className = 'line-number';
        lineNumberSpan.textContent = rightLineNumber;
        rightLineDiv.appendChild(lineNumberSpan);
      }

      // 添加行内容，并处理词级别的差异高亮
      const lineContentDiv = document.createElement('div');
      lineContentDiv.className = 'line-content';

      if (part.type === 'modify' && highlightChanges) {
        lineContentDiv.innerHTML = highlightWordDifferences(part.rightContent, 'added');
      } else {
        lineContentDiv.textContent = part.rightContent;
      }

      rightLineDiv.appendChild(lineContentDiv);
      rightPanelRef.value.appendChild(rightLineDiv);
    }
  });

  // 更新差异统计
  diffStats.added = addedLines;
  diffStats.deleted = deletedLines;
  diffStats.modified = modifiedLines;
}


// 辅助函数：判断是否应当高亮显示该行（用于突出显示当前关注的变更部分）
function shouldHighlightLine(part, index, diffResult) {
  // 如果当前行是变更行，或者在变更行的上下文中，则高亮显示
  if (part.type === 'modify' || part.type === 'add' || part.type === 'delete') {
    return true;
  }

  // 检查是否在变更行的上下文（前后 3 行）内
  for (let i = Math.max(0, index - 3); i < Math.min(diffResult.length, index + 4); i++) {
    if (i === index) continue;

    const nearby = diffResult[i];
    if (nearby.type === 'modify' || nearby.type === 'add' || nearby.type === 'delete') {
      return true;
    }
  }

  return false;
}

// 辅助函数：高亮显示单词级别的差异
function highlightWordDifferences(content, diffType) {
  // 这里应该使用差异比较算法来识别具体哪些词发生了变化
  // 这个例子中，我们假设已经知道哪些词需要高亮显示

  // 在实际实现中，你可能需要使用词级别的差异比较算法
  // 以下是简化的示例实现

  // 假设你已经有了一个函数来标记需要高亮的单词
  const markedContent = content.replace(/\b(changed|word|here)\b/g, match => {
    return `<span class="diff-text-${diffType}">${match}</span>`;
  });

  return markedContent;
}


// 辅助函数：计算两段文本的差异
function computeDiff(oldText, newText) {
  // 这里需要实际实现差异比较算法
  // 你可以使用 diff 库，如 jsdiff, google-diff-match-patch 等

  // 以下是一个返回模拟数据的示例
  const lines1 = oldText.split('\n');
  const lines2 = newText.split('\n');

  const result = [];
  let leftLineNumber = 1;
  let rightLineNumber = 1;

  // 这里只是一个简单的模拟实现
  // 实际应用中应使用真正的差异比较算法
  for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
    if (i < lines1.length && i < lines2.length) {
      if (lines1[i] === lines2[i]) {
        result.push({
          type: 'same',
          leftContent: lines1[i],
          rightContent: lines2[i],
          leftLineNumber: leftLineNumber++,
          rightLineNumber: rightLineNumber++
        });
      } else {
        result.push({
          type: 'modify',
          leftContent: lines1[i],
          rightContent: lines2[i],
          leftLineNumber: leftLineNumber++,
          rightLineNumber: rightLineNumber++
        });
      }
    } else if (i < lines1.length) {
      result.push({
        type: 'delete',
        leftContent: lines1[i],
        leftLineNumber: leftLineNumber++
      });
    } else {
      result.push({
        type: 'add',
        rightContent: lines2[i],
        rightLineNumber: rightLineNumber++
      });
    }
  }

  return result;
}



// 同步左右面板的滚动
const syncPanelScroll = () => {
  if (!leftPanel.value || !rightPanel.value) return;

  const handleLeftScroll = () => {
    rightPanel.value.scrollTop = leftPanel.value.scrollTop;
  };

  const handleRightScroll = () => {
    leftPanel.value.scrollTop = rightPanel.value.scrollTop;
  };

  leftPanel.value.addEventListener('scroll', handleLeftScroll);
  rightPanel.value.addEventListener('scroll', handleRightScroll);

  // 在组件销毁时移除事件监听
  watch(compareDialogVisible, (newVal) => {
    if (!newVal) {
      leftPanel.value?.removeEventListener('scroll', handleLeftScroll);
      rightPanel.value?.removeEventListener('scroll', handleRightScroll);
    }
  });
};

// 关闭比较对话框
const closeCompareDialog = () => {
  compareDialogVisible.value = false;
  currentVersion.value = null;
  previousVersion.value = null;
  leftVersionId.value = null;
  rightVersionId.value = null;
};

// 恢复版本
const restoreVersion = (version) => {
  selectedVersion.value = version;
  restoreDialogVisible.value = true;
};

// 确认恢复版本
const confirmRestoreVersion = async () => {
  try {
    // 这里应该是实际的API调用
    // await api.restoreVersion(articleId, selectedVersion.value.id);

    // 模拟恢复成功
    ElMessage.success(`已成功恢复到版本 ${selectedVersion.value.versionNumber}`);
    restoreDialogVisible.value = false;

    // 重新加载版本历史
    fetchArticleData();
  } catch (error) {
    console.error('恢复版本失败:', error);
    ElMessage.error('恢复版本失败');
  }
};

// 返回文章页面
const backToArticle = () => {
  router.push(`/article/${articleId}`);
};

// 初始化
onMounted(() => {
  fetchArticleData();
});
</script>

<style scoped>
/* 基础容器样式 */
.version-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: var(--el-font-family);
  background-color: transparent; /* 移除白色背景 */
}

.version-history-card {
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  background-color: transparent; /* 移除白色背景 */
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 加载和空状态样式 */
.loading-container {
  padding: 30px 0;
}

.empty-state {
  padding: 50px 0;
  text-align: center;
}

/* 时间线和版本卡片样式 */
.version-history-content {
  padding: 15px 0;
}

.version-card {
  margin-bottom: 15px;
  transition: all 0.3s ease;
  border-radius: 6px;
  background-color: rgba(30, 30, 30, 0.7); /* 深色背景 */
}

.version-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

/* 版本卡片头部样式 */
.version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.version-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-actions {
  display: flex;
  gap: 10px;
}

/* 版本描述样式 */
.version-description {
  margin-bottom: 16px;
  color: var(--el-text-color-regular);
  font-size: 15px;
  line-height: 1.5;
}

.version-description p {
  margin: 0;
}

/* 版本统计信息样式 */
.version-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 版本标签样式 */
.version-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin-right: 0;
}

/* 预览对话框样式 */
.preview-content {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e; /* 深色背景 */
  color: #e0e0e0;
}

.preview-header {
  padding: 15px 20px;
  background-color: #2d2d2d; /* 深色背景 */
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview-title {
  margin-bottom: 15px;
}

.preview-title h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #e0e0e0;
}

.preview-subtitle {
  font-size: 16px;
  color: #aaaaaa;
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.author-name {
  font-weight: 500;
  color: #e0e0e0;
}

.preview-stats {
  display: flex;
  gap: 15px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #333333;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #cccccc;
}

.preview-body {
  padding: 0 20px 30px;
  flex: 1;
  overflow-y: auto;
}

/* Markdown 内容样式 */
.markdown-body {
  font-size: 16px;
  line-height: 1.8;
  color: #e0e0e0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: 600;
  color: #e0e0e0;
}

.markdown-body p {
  margin: 1em 0;
}

.markdown-body pre,
.markdown-body code {
  background-color: #2d2d2d;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  color: #e0e0e0;
}

.markdown-body pre {
  padding: 16px;
  overflow: auto;
  margin-bottom: 16px;
}

.markdown-body code {
  padding: 2px 5px;
}

/* 版本比较对话框样式 */
.compare-content {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e; /* 深色背景 */
  color: #e0e0e0;
}

.compare-header {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #2d2d2d; /* 深色背景 */
  border-radius: 8px;
}

.compare-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
}

.version-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-label {
  font-size: 14px;
  color: #cccccc;
}

.diff-settings {
  display: flex;
  gap: 15px;
  margin-left: auto;
}

/* IDE风格的差异比较容器 */
.ide-diff-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #444444;
  border-radius: 8px;
  overflow: hidden;
  height: calc(100% - 80px);
  background-color: #1e1e1e; /* 深色背景 */
}

.diff-panels {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.diff-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel {
  border-right: 1px solid #444444;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #2d2d2d; /* 深色背景 */
  border-bottom: 1px solid #444444;
}

.panel-version {
  font-weight: 500;
  color: #e0e0e0;
}

.panel-date {
  color: #aaaaaa;
  font-size: 13px;
}

.panel-content {
  flex: 1;
  padding: 15px;
  overflow: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #e0e0e0;
  background-color: #1e1e1e; /* 深色背景 */
}

/* 差异比较摘要 */
.diff-summary {
  display: flex;
  padding: 10px 15px;
  background-color: #2d2d2d; /* 深色背景 */
  border-top: 1px solid #444444;
}

.summary-item {
  display: flex;
  align-items: center;
  margin-right: 20px;
  font-size: 13px;
}

.summary-icon {
  margin-right: 6px;
  display: flex;
  align-items: center;
}

.summary-item.added .summary-icon {
  color: #67c23a;
}

.summary-item.modified .summary-icon {
  color: #e6a23c;
}

.summary-item.deleted .summary-icon {
  color: #f56c6c;
}

/* 差异高亮样式 - 改进突出显示 */
.diff-line {
  display: flex;
  margin-bottom: 2px;
  border-radius: 3px;
  position: relative;
}

.line-number {
  color: #909399;
  margin-right: 10px;
  user-select: none;
  min-width: 40px;
  text-align: right;
  padding: 0 5px;
}

.line-content {
  flex: 1;
  padding: 0 5px;
}

/* 增强差异高亮样式，类似于你图片中的效果 */
.diff-added {
  background-color: rgba(40, 124, 0, 0.5); /* 深绿色背景 */
  position: relative;
}

.diff-added::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #67c23a; /* 绿色左边框 */
}

.diff-deleted {
  background-color: rgba(124, 0, 0, 0.5); /* 深红色背景 */
  position: relative;
}

.diff-deleted::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #f56c6c; /* 红色左边框 */
}

.diff-modified {
  background-color: rgba(100, 70, 0, 0.5); /* 深黄色背景 */
  position: relative;
}

.diff-modified::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #e6a23c; /* 黄色左边框 */
}

/* 突出显示具体差异文本 */
.diff-text-added {
  background-color: rgba(103, 194, 58, 0.6);
  border-radius: 2px;
  padding: 0 2px;
}

.diff-text-deleted {
  background-color: rgba(245, 108, 108, 0.6);
  border-radius: 2px;
  padding: 0 2px;
  text-decoration: line-through;
}

.diff-text-modified {
  background-color: rgba(230, 162, 60, 0.6);
  border-radius: 2px;
  padding: 0 2px;
}

/* 恢复确认对话框 */
.restore-confirm-content {
  margin-bottom: 20px;
}

.restore-confirm-content p {
  margin: 8px 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .compare-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .diff-settings {
    margin-left: 0;
    margin-top: 10px;
  }

  .diff-panels {
    flex-direction: column;
  }

  .left-panel {
    border-right: none;
    border-bottom: 1px solid #444444;
  }
}

/* 对比面板滚动条美化 */
.panel-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #555555;
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #666666;
}

/* 增加行高亮效果，类似于图片中的效果 */
.highlight-row {
  background-color: rgba(65, 105, 225, 0.2); /* 蓝色背景，类似于图片中的高亮行 */
  width: 100%;
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: -1;
}
</style>
