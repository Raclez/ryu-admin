<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import {useRoute, useRouter} from 'vue-router';

import {
  ArrowDown,
  ArrowUp,
  Brush,
  Close,
  Collection,
  Document,
  DocumentCopy,
  Edit,
  InfoFilled,
  Loading,
  Menu,
  Plus,
  Refresh,
  RefreshRight,
  Timer,
  User,
  View,
  ZoomIn,
  ZoomOut,
} from '@element-plus/icons-vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {MdEditor} from 'md-editor-v3';

import {getVersion, getVersions} from '#/api/core/historyVersion.ts';
import DiffViewer from '#/components/DiffViewer.vue';

import 'md-editor-v3/lib/style.css';

// 路由相关
const route = useRoute();
const router = useRouter();
const articleId = route.params.id;

// 数据状态
const loading = ref(false);
const isLoadingMore = ref(false);
const article = ref({title: '加载中...'});
const versions = ref([]);
const finished = ref(false);
const cursor = ref(null);
const limit = 10;

// 对话框状态
const previewVisible = ref(false);
const compareDialogVisible = ref(false);
const restoreConfirmVisible = ref(false);
const previewLoading = ref(false);

// 版本相关
const currentVersion = ref(null);
const compareVersion = ref(null);
const latestVersion = ref(null);
const previewContent = ref('');
const compareLoading = ref(false);

// 比较相关
const isSideBySide = ref(true);
const showWhitespace = ref(false);
const currentDiffIndex = ref(0);
const diffCount = ref(0);
const currentLine = ref(1);
const currentColumn = ref(1);
const totalLines = ref(0);
const diffViewerRef = ref(null);

// 标签相关
const tagDialogVisible = ref(false);
const tagForm = ref({
  tag: '',
  type: 'info',
});
const selectedVersionForTag = ref(null);

// 可用的标签列表
const availableTags = computed(() => {
  const tags = new Set();
  versions.value.forEach((version) => {
    version.tags?.forEach((tag) => tags.add(tag));
  });
  return [...tags];
});

// 将文件扩展名转换为Monaco编辑器支持的语言
const fileExtToLanguage = (ext) => {
  const mapping = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    md: 'markdown',
    vue: 'html',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    py: 'python',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    cs: 'csharp',
    go: 'go',
    php: 'php',
    rb: 'ruby',
    rs: 'rust',
    sh: 'shell',
    sql: 'sql',
    swift: 'swift',
    dart: 'dart',
    kt: 'kotlin',
  };

  return mapping[ext] || 'plaintext';
};

// 从文件名中提取扩展名
const extractFileExtension = (filename) => {
  if (!filename) return 'md';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'md';
};

// 检查获取的内容是否为纯文本或JSON
const parseVersionContent = (content) => {
  try {
    // 尝试解析为JSON
    const parsed = JSON.parse(content);
    return parsed.content || parsed || content;
  } catch {
    // 如果不是JSON，直接返回原始内容
    return content;
  }
};

// 获取版本历史
const fetchVersions = async (isLoadMore = false) => {
  if (loading.value || (isLoadMore && finished.value)) return;

  try {
    loading.value = true;
    isLoadingMore.value = isLoadMore;

    const params = {limit};
    if (isLoadMore && cursor.value) {
      params.cursor = cursor.value;
    }

    const response = await getVersions(route.params.id, params);
    const newVersions = response.data || response;

    if (newVersions.length < limit) {
      finished.value = true;
    }

    if (isLoadMore) {
      versions.value = [...versions.value, ...newVersions];
    } else {
      versions.value = newVersions;
      finished.value = false;
    }

    if (newVersions.length > 0) {
      cursor.value = newVersions[newVersions.length - 1].id;
    }
  } catch (error) {
    console.error('获取版本历史失败:', error);
    ElMessage.error('获取版本历史失败');
  } finally {
    loading.value = false;
    isLoadingMore.value = false;
  }
};

/**
 * 格式化日期
 */
const formatDate = (date) => {
  if (!date) return '未知时间';

  // 如果已经是格式化的字符串，直接返回
  if (typeof date === 'string' && (date.includes('-') || date.includes('/'))) {
    return date;
  }

  try {
    const dateObj = new Date(date);
    return dateObj
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
      .replaceAll('/', '-');
  } catch (error) {
    console.error('日期格式化错误', error);
    return String(date);
  }
};

// 获取时间线项目类型
const getTimelineItemType = (version) => {
  if (version.isLatest) return 'success';
  if (version.tags?.includes('重要更新')) return 'danger';
  if (version.tags?.includes('问题修复')) return 'warning';
  return 'primary';
};

// 获取时间线项目颜色
const getTimelineItemColor = (index) => {
  if (index === 0) return '#67C23A'; // 最新版本绿色
  if (index === 1) return '#E6A23C'; // 第二新版本黄色
  return '#909399'; // 其他版本灰色
};

// 切换差异视图模式
const toggleDiffViewMode = () => {
  isSideBySide.value = !isSideBySide.value;
  if (diffViewerRef.value) {
    // 通过引用调用DiffViewer组件的方法来切换模式
    nextTick(() => {
      const editor = diffViewerRef.value.diffEditor;
      if (editor) {
        editor.updateOptions({renderSideBySide: isSideBySide.value});
      }
    });
  }
};

// 处理预览
const handlePreview = async (version) => {
  currentVersion.value = await getVersion(route.params.id, version.version);
  previewVisible.value = true;
  previewLoading.value = true;

  try {
    previewContent.value = JSON.parse(currentVersion.value.content).content;
  } catch {
    ElMessage.error('预览内容加载失败');
  } finally {
    previewLoading.value = false;
  }
};

const compareContent = ref('');
const latestContent = ref('');
// 处理版本比较
const handleCompare = async (version) => {
  compareVersion.value = await getVersion(route.params.id, version.version);

  latestVersion.value = await getVersion(
    route.params.id,
    versions.value.find((v) => v.latest).version,
  );

  compareContent.value = JSON.parse(compareVersion.value.content);
  latestContent.value = JSON.parse(latestVersion.value.content);

  compareDialogVisible.value = true;
};

// 处理恢复版本
const handleRestore = (version) => {
  currentVersion.value = version;
  restoreConfirmVisible.value = true;
};

// 确认恢复版本
const confirmRestore = async () => {
  if (!currentVersion.value) return;

  restoring.value = true;
  try {
    await restoreVersion(currentVersion.value.id);
    ElMessage.success('版本恢复成功');
    restoreConfirmVisible.value = false;
    await fetchVersions();
  } catch {
    ElMessage.error('版本恢复失败');
  } finally {
    restoring.value = false;
  }
};

// 处理添加标签
const handleAddTag = (version) => {
  selectedVersionForTag.value = version;
  tagForm.value = {
    tag: '',
    type: 'info',
  };
  tagDialogVisible.value = true;
};

// 确认添加标签
const confirmAddTag = async () => {
  if (!selectedVersionForTag.value || !tagForm.value.tag) return;

  try {
    await addTag(selectedVersionForTag.value.id, tagForm.value.tag);
    ElMessage.success('标签添加成功');
    tagDialogVisible.value = false;
    await fetchVersions();
  } catch {
    ElMessage.error('标签添加失败');
  }
};

// 处理删除标签
const handleRemoveTag = async (version, tag) => {
  try {
    await ElMessageBox.confirm(`确定要删除标签 "${tag}" 吗？`, '删除标签', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await removeTag(version.id, tag);
    ElMessage.success('标签删除成功');
    await fetchVersions();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('标签删除失败');
    }
  }
};

// 获取标签类型
const getTagType = (tag) => {
  const types = {
    重要更新: 'danger',
    功能优化: 'success',
    问题修复: 'warning',
    内容更新: 'info',
  };
  return types[tag] || 'info';
};

// 创建新版本
const handleCreateVersion = () => {
  // TODO: 实现创建新版本的功能
  ElMessage.info('创建新版本功能开发中...');
};

// 刷新版本列表
const refreshVersions = () => {
  cursor.value = null;
  finished.value = false;
  fetchVersions(false);
};

// 监听滚动事件
const handleScroll = () => {
  if (loading.value || finished.value) return;

  const scrollHeight = document.documentElement.scrollHeight;
  const scrollTop = document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;

  // 提前200px触发加载更多，提升用户体验
  if (scrollHeight - scrollTop - clientHeight < 200) {
    fetchVersions(true);
  }
};

// 比较功能按钮事件
const toggleSideBySide = () => {
  isSideBySide.value = !isSideBySide.value;
  if (diffViewerRef.value) {
    nextTick(() => {
      const editor = diffViewerRef.value.diffEditor;
      if (editor) {
        editor.updateOptions({renderSideBySide: isSideBySide.value});
      }
    });
  }
};

const toggleWhitespace = () => {
  showWhitespace.value = !showWhitespace.value;
  if (diffViewerRef.value) {
    nextTick(() => {
      const editor = diffViewerRef.value.diffEditor;
      if (editor) {
        editor.updateOptions({ignoreTrimWhitespace: !showWhitespace.value});
      }
    });
  }
};

// 字体大小调整功能
const editorFontSize = ref(14); // 默认字体大小

// 字体增大
const increaseFontSize = () => {
  editorFontSize.value += 2;
  updateEditorFontSize();
};

// 字体减小
const decreaseFontSize = () => {
  if (editorFontSize.value > 10) {
    editorFontSize.value -= 2;
    updateEditorFontSize();
  }
};

// 更新编辑器字体大小
const updateEditorFontSize = () => {
  if (diffViewerRef.value?.diffEditor) {
    const editor = diffViewerRef.value.diffEditor;
    const origEditor = editor.getOriginalEditor();
    const modEditor = editor.getModifiedEditor();

    origEditor.updateOptions({fontSize: editorFontSize.value});
    modEditor.updateOptions({fontSize: editorFontSize.value});
  }
};

// 使用监听器在对话框可见时初始化字体大小
watch(compareDialogVisible, (newVal) => {
  if (newVal) {
    // 设置初始焦点到编辑器，以便键盘事件能工作
    nextTick(() => {
      if (diffViewerRef.value?.diffEditor) {
        diffViewerRef.value.diffEditor.focus();

        // 初始化字体大小
        updateEditorFontSize();
      }
    });
  }
});

// 导航到下一个差异
const goToNextDiff = () => {
  if (diffCount.value === 0) return;

  if (diffViewerRef.value) {
    diffViewerRef.value.goToNextDiff();
  }
};

// 导航到上一个差异
const goToPrevDiff = () => {
  if (diffCount.value === 0) return;

  if (diffViewerRef.value) {
    diffViewerRef.value.goToPreviousDiff();
  }
};

// 支持键盘导航
const handleKeyDown = (e) => {
  if (compareDialogVisible.value) {
    switch (e.key) {
      case '+':
      case '=': {
        // 字体放大快捷键
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          increaseFontSize();
        }

        break;
      }
      case '-':
      case '_': {
        // 字体缩小快捷键
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          decreaseFontSize();
        }

        break;
      }
      case 'ArrowDown':
      case 'j': {
        e.preventDefault();
        goToNextDiff();

        break;
      }
      case 'ArrowUp':
      case 'k': {
        e.preventDefault();
        goToPrevDiff();

        break;
      }
      case 'Escape': {
        e.preventDefault();
        compareDialogVisible.value = false;

        break;
      }
      // No default
    }
  }
};

// 组件挂载时添加滚动监听
onMounted(() => {
  fetchVersions();
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('keydown', handleKeyDown);

  // 添加自定义事件监听
  window.addEventListener('close-diff-dialog', () => {
    compareDialogVisible.value = false;
  });
});

// 组件卸载时移除滚动监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('close-diff-dialog', () => {
    compareDialogVisible.value = false;
  });
});

// 监听对话框可见状态变化，在显示时设置键盘事件
watch(compareDialogVisible, (newVal) => {
  if (newVal) {
    // 设置初始焦点到编辑器，以便键盘事件能工作
    nextTick(() => {
      if (diffViewerRef.value?.diffEditor) {
        diffViewerRef.value.diffEditor.focus();

        // 初始化字体大小
        updateEditorFontSize();
      }
    });
  }
});

const onDiffLoaded = (data) => {
  console.log('差异加载完成:', data);
  diffCount.value = data.diffCount || 0;
  totalLines.value = data.totalLines || 0;
  currentDiffIndex.value = 0;
};

const onDiffNavigated = (data) => {
  console.log('差异导航事件:', data);
  currentDiffIndex.value = data.currentIndex || 0;
  currentLine.value = data.currentLine || 1;
  currentColumn.value = data.currentColumn || 1;
};
</script>

<template>
  <div class="version-history-container">
    <el-card class="version-history-card">
      <template #header>
        <div class="card-header">
          <h2>版本历史</h2>
          <div class="header-actions">
            <el-button
              :icon="Refresh"
              :loading="loading && !isLoadingMore"
              type="primary"
              @click="refreshVersions"
            >
              刷新
            </el-button>
            <el-button :icon="Plus" type="success" @click="handleCreateVersion">
              创建新版本
            </el-button>
          </div>
        </div>
      </template>

      <div
        v-if="loading && !isLoadingMore && versions.length === 0"
        class="loading-container"
      >
        <el-skeleton :rows="6" animated/>
      </div>

      <div v-else-if="versions.length === 0" class="empty-state">
        <el-empty description="暂无版本历史记录"/>
      </div>

      <div v-else class="version-history-content">
        <el-timeline>
          <el-timeline-item
            v-for="version in versions"
            :key="version.id"
            :timestamp="formatDate(version.createTime)"
            :type="getTimelineItemType(version)"
            placement="top"
          >
            <el-card class="version-card">
              <div class="version-header">
                <div class="version-info">
                  <h3>版本 {{ version.version }}</h3>
                  <div class="version-meta">
                    <span>
                      <el-icon><User/></el-icon>
                      {{ version.createBy }}
                    </span>
                    <span>
                      <el-icon><Timer/></el-icon>
                      {{ formatDate(version.createTime) }}
                    </span>
                    <el-tag
                      v-if="version.latest"
                      effect="light"
                      size="small"
                      type="success"
                    >
                      最新版本
                    </el-tag>
                  </div>
                </div>
                <div class="version-actions">
                  <el-button
                    :icon="View"
                    :loading="previewLoading"
                    type="primary"
                    @click="handlePreview(version)"
                  >
                    预览
                  </el-button>
                  <el-button
                    :icon="DocumentCopy"
                    type="info"
                    @click="handleCompare(version)"
                  >
                    比较
                  </el-button>
                  <el-button
                    :icon="RefreshRight"
                    type="success"
                    @click="handleRestore(version)"
                  >
                    恢复
                  </el-button>
                </div>
              </div>

              <div class="version-stats">
                <div class="stat-item">
                  <el-icon>
                    <Document/>
                  </el-icon>
                  <span>字数：{{ version.wordCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <el-icon>
                    <Timer/>
                  </el-icon>
                  <span>耗时：{{ version.duration || '0分钟' }}</span>
                </div>
                <div class="stat-item">
                  <el-icon>
                    <Edit/>
                  </el-icon>
                  <span>修改次数：{{ version.modifyCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <el-icon>
                    <Collection/>
                  </el-icon>
                  <span>标签数：{{ version.tags?.length || 0 }}</span>
                </div>
              </div>

              <div class="version-description">
                <p>{{ version.description || '暂无描述' }}</p>
              </div>

              <div class="version-tags">
                <el-tag
                  v-for="tag in version.tags"
                  :key="tag"
                  :type="getTagType(tag)"
                  class="tag-item"
                  closable
                  effect="light"
                  @close="handleRemoveTag(version, tag)"
                >
                  {{ tag }}
                </el-tag>
                <el-button
                  :icon="Plus"
                  link
                  type="primary"
                  @click="handleAddTag(version)"
                >
                  添加标签
                </el-button>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 懒加载状态 -->
      <div v-if="loading && isLoadingMore" class="loading-more">
        <el-icon class="is-loading">
          <Loading/>
        </el-icon>
        <span>加载更多版本...</span>
      </div>

      <!-- 没有更多数据提示 -->
      <div v-if="finished && versions.length > 0" class="load-finished">
        <el-divider>没有更多版本了</el-divider>
      </div>
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :close-on-click-modal="false"
      :show-close="true"
      class="fullscreen-dialog preview-dialog"
      destroy-on-close
      fullscreen
      title="版本预览"
    >
      <div class="preview-container">
        <!-- 版本信息头部 -->
        <div class="preview-header">
          <div class="version-info">
            <div class="version-badge">版本 {{ currentVersion?.version }}</div>
            <div class="version-meta">
              <span class="meta-item">
                <el-icon><User/></el-icon>
                {{ currentVersion?.createBy || '未知' }}
              </span>
              <span class="meta-item">
                <el-icon><Timer/></el-icon>
                {{ formatDate(currentVersion?.createTime) }}
              </span>
              <span class="meta-item">
                <el-icon><Document/></el-icon>
                字数: {{ currentVersion?.wordCount || 0 }}
              </span>
              <span class="meta-item">
                <el-icon><Edit/></el-icon>
                修改: {{ currentVersion?.modifyCount || 0 }}次
              </span>
              <span v-if="currentVersion?.isLatest" class="meta-item">
                <el-tag effect="dark" size="small" type="success"
                >最新版本</el-tag
                >
              </span>
            </div>
          </div>
        </div>

        <!-- 描述区域 -->
        <div v-if="currentVersion?.description" class="version-description-bar">
          <el-icon>
            <InfoFilled/>
          </el-icon>
          <span>{{ currentVersion?.description }}</span>
        </div>

        <!-- 标签区域 -->
        <div v-if="currentVersion?.tags?.length" class="version-tags-bar">
          <div class="tag-list">
            <el-tag
              v-for="tag in currentVersion?.tags"
              :key="tag"
              :type="getTagType(tag)"
              class="version-tag"
              effect="light"
              size="small"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <!-- 内容预览区域 -->
        <div class="content-preview-area">
          <template v-if="previewLoading">
            <div class="preview-loading">
              <el-icon class="loading-icon">
                <Loading/>
              </el-icon>
              <span>加载中...</span>
            </div>
          </template>
          <template v-else>
            <MdEditor
              v-model="previewContent"
              :preview-only="true"
              :toolbars="[]"
              class="preview-editor"
              theme="dark"
            />
          </template>
        </div>
      </div>
    </el-dialog>

    <!-- 版本比较对话框 -->
    <el-dialog
      v-model="compareDialogVisible"
      :close-on-click-modal="false"
      :show-close="false"
      class="fullscreen-dialog compare-dialog"
      destroy-on-close
      fullscreen
    >
      <div class="compare-container">
        <!-- 顶部工具栏 -->
        <div class="top-toolbar">
          <div class="toolbar-left">
            <div class="diff-counter">
              <span>{{
                  diffCount > 0
                    ? `差异: ${currentDiffIndex + 1}/${diffCount}`
                    : '无差异'
                }}</span>
            </div>
            <div class="nav-buttons">
              <el-button
                :disabled="currentDiffIndex <= 0"
                :icon="ArrowUp"
                class="toolbar-btn"
                @click="goToPrevDiff"
              >
                上一处
              </el-button>
              <el-button
                :disabled="currentDiffIndex >= diffCount - 1"
                :icon="ArrowDown"
                class="toolbar-btn"
                @click="goToNextDiff"
              >
                下一处
              </el-button>
            </div>
          </div>
          <div class="toolbar-right">
            <el-button
              :icon="Menu"
              class="toolbar-btn"
              title="切换视图模式"
              @click="toggleSideBySide"
            >
              {{ isSideBySide ? '并排视图' : '内联视图' }}
            </el-button>
            <el-button
              :icon="ZoomOut"
              class="toolbar-btn"
              title="减小字体"
              @click="decreaseFontSize"
            >
              字体缩小
            </el-button>
            <el-button
              :icon="ZoomIn"
              class="toolbar-btn"
              title="增大字体"
              @click="increaseFontSize"
            >
              字体放大
            </el-button>
            <el-button
              :icon="Brush"
              class="toolbar-btn"
              title="显示空白字符"
              @click="toggleWhitespace"
            >
              {{ showWhitespace ? '隐藏空白' : '显示空白' }}
            </el-button>
            <el-button
              :icon="Close"
              class="toolbar-btn close-btn"
              title="关闭"
              @click="compareDialogVisible = false"
            >
              关闭
            </el-button>
          </div>
        </div>

        <!-- 版本标题栏 -->
        <div class="version-header-bar">
          <div class="version-header old">
            <div class="version-label">
              历史版本 v{{ compareVersion?.version }}
            </div>
            <div class="version-date">
              {{ formatDate(compareVersion?.createTime) }}
            </div>
          </div>
          <div class="version-header current">
            <div class="version-label">
              最新版本 v{{ latestVersion?.version }}
            </div>
            <div class="version-date">
              {{ formatDate(latestVersion?.createTime) }}
            </div>
          </div>
        </div>

        <!-- 比较内容区域 -->
        <div class="diff-viewer-wrapper">
          <DiffViewer
            v-if="compareContent && latestContent"
            ref="diffViewerRef"
            :current-version="latestVersion"
            :modified="latestContent.content"
            :original="compareContent.content"
            :previous-version="compareVersion"
            :render-side-by-side="isSideBySide"
            language="markdown"
            @diff-loaded="onDiffLoaded"
            @diff-navigated="onDiffNavigated"
          />
        </div>

        <!-- 编辑器状态栏 -->
        <div class="editor-statusbar">
          <div class="status-left">
            <span class="status-item status-position"
            >Ln {{ currentLine }}, Col {{ currentColumn }}</span
            >
            <span class="status-item status-divider">|</span>
            <span class="status-item status-lines">共 {{ totalLines }} 行</span>
            <span class="status-item status-divider">|</span>
            <span class="status-item status-words"
            >{{ compareContent?.wordCount || 0 }} →
              {{ latestContent?.wordCount || 0 }} 字</span
            >
          </div>
          <div class="status-right">
            <span class="status-item">Markdown</span>
            <span class="status-item status-divider">|</span>
            <span class="status-item">{{
                isSideBySide ? '并排视图' : '内联视图'
              }}</span>
            <span class="status-item status-divider">|</span>
            <span class="status-item">UTF-8</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 恢复版本确认对话框 -->
    <el-dialog
      v-model="restoreConfirmVisible"
      :close-on-click-modal="false"
      title="恢复版本确认"
      width="500px"
    >
      <div class="restore-confirm-content">
        <el-alert :closable="false" show-icon title="警告" type="warning">
          <template #default>
            <p>确定要恢复到版本 {{ currentVersion?.version }} 吗？</p>
            <p>此操作将覆盖当前内容，且无法撤销。</p>
          </template>
        </el-alert>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="restoreConfirmVisible = false">取消</el-button>
          <el-button :loading="restoring" type="danger" @click="confirmRestore">
            确认恢复
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加标签对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      :close-on-click-modal="false"
      title="添加标签"
      width="400px"
    >
      <div class="tag-dialog-content">
        <el-form :model="tagForm" label-width="80px">
          <el-form-item label="标签名称">
            <el-select
              v-model="tagForm.tag"
              allow-create
              default-first-option
              filterable
              placeholder="请选择或输入标签"
            >
              <el-option
                v-for="tag in availableTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="标签类型">
            <el-select v-model="tagForm.type" placeholder="请选择标签类型">
              <el-option label="重要更新" value="danger"/>
              <el-option label="功能优化" value="success"/>
              <el-option label="问题修复" value="warning"/>
              <el-option label="内容更新" value="info"/>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="tagDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddTag">
            确认添加
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
/* 基础容器样式 */
.version-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: var(--el-font-family), serif;
  background-color: transparent;
}

.version-history-card {
  margin-bottom: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  background-color: transparent;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: linear-gradient(135deg, #2c3e50, #3498db);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 时间线和版本卡片样式 */
.version-history-content {
  padding: 20px;
}

.version-card {
  margin-bottom: 20px;
  transition: all 0.3s ease;
  border-radius: 10px;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.version-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 版本卡片头部样式 */
.version-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.version-info h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.version-info h3::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #3498db, #2ecc71);
  border-radius: 2px;
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.version-actions {
  display: flex;
  gap: 12px;
}

.version-actions .el-button {
  transition: all 0.3s ease;
}

.version-actions .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 版本描述样式 */
.version-description {
  padding: 20px;
  color: var(--el-text-color-regular);
  font-size: 15px;
  line-height: 1.6;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 0 0 10px 10px;
}

.version-description p {
  margin: 0;
}

/* 版本统计信息样式 */
.version-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 15px 20px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  margin: 0 20px 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-item .el-icon {
  font-size: 16px;
  color: #3498db;
}

/* 版本标签样式 */
.version-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 20px;
}

.tag-item {
  margin-right: 0;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  transition: all 0.3s ease;
}

.tag-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 时间线样式优化 */
:deep(.el-timeline-item__node) {
  background-color: #3498db;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #3498db;
}

:deep(.el-timeline-item__tail) {
  border-left-color: rgba(52, 152, 219, 0.2);
}

:deep(.el-timeline-item__timestamp) {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 500;
}

/* 加载和空状态样式 */
.loading-container {
  padding: 40px 0;
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 12px;
  margin: 20px;
}

/* 全屏对话框样式 */
.fullscreen-dialog {
  display: flex;
  flex-direction: column;

  :deep(.el-dialog) {
    display: flex;
    flex-direction: column;
    margin: 0 !important;
    max-width: 100%;
    height: 100%;
    background: rgba(30, 32, 36, 0.98);
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    height: 0;
  }

  :deep(.el-dialog__headerbtn) {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 10000;

    .el-dialog__close {
      font-size: 20px;
      color: white;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.5);
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
    flex-grow: 1;
    overflow: hidden;
    height: 100%;
  }
}

/* 预览页面样式 */
.preview-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  color: #eee;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.version-badge {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.version-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #aaa;

  .el-icon {
    color: #888;
  }
}

.preview-actions {
  display: flex;
  gap: 10px;

  .el-button {
    border-color: rgba(255, 255, 255, 0.2);
    color: #ddd;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
    }

    &.el-button--primary {
      color: #409eff;
    }

    &.el-button--success {
      color: #67c23a;
    }

    .el-icon {
      margin-right: 4px;
    }
  }
}

.version-description-bar {
  padding: 10px 24px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #aaa;

  .el-icon {
    color: #909399;
  }
}

.version-tags-bar {
  padding: 10px 24px;
  display: flex;
  align-items: center;

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .version-tag {
    margin: 0;
  }
}

.content-preview-area {
  flex: 1;
  overflow: auto;
  padding: 0;

  .preview-editor {
    height: 100%;
  }
}

.preview-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 16px;
  color: #aaa;

  .loading-icon {
    font-size: 40px;
    animation: rotate 1.5s linear infinite;
  }
}

/* 比较页面样式 */
.compare-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  color: #eee;
  position: relative;
  background-color: #1e1e1e;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 顶部工具栏 */
.top-toolbar {
  height: 56px;
  background-color: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  backdrop-filter: blur(5px);
  margin: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  height: 100%;
}

.toolbar-left {
  gap: 12px;
}

.toolbar-right {
  gap: 8px;
}

.diff-counter {
  background-color: rgba(65, 105, 225, 0.15);
  height: 38px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  border-radius: 6px;
  border: 1px solid rgba(65, 105, 225, 0.3);

  span {
    font-size: 14px;
    font-weight: 500;
    color: #eee;
  }
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  height: 38px;
  font-size: 14px;
  background-color: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f0f0f0;
  padding: 0 16px;
  border-radius: 6px;
  margin: 0;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 80px;

  &:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.08);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    background-color: rgba(255, 255, 255, 0.06);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.close-btn {
    color: #e5e7eb;
    border-color: rgba(255, 255, 255, 0.2);
    background-color: rgba(255, 255, 255, 0.05);

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.4);
    }
  }

  .el-icon {
    margin-right: 6px;
    font-size: 16px;
  }
}

/* 导航按钮样式 */
.nav-buttons .toolbar-btn {
  min-width: 40px;
  padding: 0 12px;

  &:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    border-right: none;
  }

  &:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}

/* 版本标题栏 */
.version-header-bar {
  display: flex;
  width: 100%;
  background-color: #1e1e1e;
  border-bottom: 1px solid #333;
  margin-top: 56px; /* 添加顶部边距，与工具栏高度一致 */
  padding: 0;
}

.version-header {
  flex: 1;
  padding: 8px 16px;
  position: relative;

  &.old {
    border-right: 1px solid #333;
    padding-left: 16px;
  }

  &.current {
    padding-left: 16px;
  }
}

.version-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.version-header.old .version-label {
  color: #dcdcdc;
}

.version-header.current .version-label {
  color: #4fc1ff;
}

.version-date {
  font-size: 12px;
  color: #888;
}

.diff-viewer-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 0;
  margin: 0;

  /* 让DiffViewer组件正确显示 */
  :deep(.diff-container),
  :deep(.monaco-container),
  :deep(.diff-editor) {
    height: 100% !important;
    width: 100% !important;
    border: none !important;
  }

  /* 增强差异显示 */
  :deep(.current-diff-line) {
    background-color: rgba(0, 122, 204, 0.2) !important;
    border-left: 3px solid #0078d4 !important;
  }

  :deep(.line-delete) {
    background-color: rgba(255, 0, 0, 0.1) !important;
    border-left: 3px solid #ff3333 !important;
  }

  :deep(.line-insert) {
    background-color: rgba(0, 255, 0, 0.1) !important;
    border-left: 3px solid #33cc33 !important;
  }
}

/* 编辑器状态栏 */
.editor-statusbar {
  height: 25px;
  background-color: #007acc;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  user-select: none;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  margin: 0;
  border: none;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  height: 100%;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 100%;

  &.status-divider {
    padding: 0;
    opacity: 0.6;
  }

  &.status-position {
    background-color: rgba(255, 255, 255, 0.2);
    font-weight: 500;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 恢复版本确认对话框样式 */
.restore-confirm-content {
  padding: 20px;
}

.restore-confirm-content .el-alert {
  border-radius: 8px;
  padding: 15px 20px;
}

.restore-confirm-content p {
  margin: 10px 0;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .version-history-container {
    padding: 10px;
  }

  .version-header {
    flex-direction: column;
    gap: 15px;
  }

  .version-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .version-stats {
    flex-direction: column;
    gap: 10px;
  }

  .stat-item {
    width: 100%;
    justify-content: center;
  }
}

/* 添加新的样式 */
.header-actions {
  display: flex;
  gap: 12px;
}

.compare-dialog {
  :deep(.el-dialog__body) {
    padding: 0 !important;
    height: 100vh;
    overflow: hidden;
  }
}

.compare-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.compare-header {
  margin-bottom: 20px;
}

.diff-viewer {
  flex: 1;
  overflow: hidden;
}

.tag-dialog-content {
  padding: 20px;
}

/* 响应式设计补充 */
@media screen and (max-width: 768px) {
  .header-actions {
    flex-direction: column;
  }

  .version-actions {
    flex-wrap: wrap;
  }

  .version-actions .el-button {
    margin-bottom: 8px;
  }
}

/* 版本标签样式 */
:deep(.version-label-container) {
  z-index: 100;
  position: sticky;
  top: 0;
  background-color: rgba(30, 30, 30, 0.95);
  width: 100%;
  padding: 8px 0;
  backdrop-filter: blur(5px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.version-label-before) {
  color: white;
  font-weight: bold;
  padding: 8px 15px;
  border-radius: 4px;
  display: inline-block;
  margin: 5px 10px;
  font-size: 14px;
  width: auto;
  max-width: 90%;
  background-color: rgba(40, 40, 40, 0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

:deep(.previous-version-label) {
  border-left: 5px solid #409eff;
}

:deep(.current-version-label) {
  border-left: 5px solid #67c23a;
}

:deep(.version-label-line) {
  padding-top: 5px;
  padding-bottom: 5px;
  background-color: transparent;
}

.loading-more {
  text-align: center;
  padding: 20px 0;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loading-more .el-icon {
  font-size: 20px;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.load-finished {
  margin: 20px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
