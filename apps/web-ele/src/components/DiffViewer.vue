<template>
  <div class="diff-container">
    <div ref="editorContainer" class="diff-editor"></div>
    <div v-if="loading" class="loading-overlay">
      <el-icon class="loading-icon"><Loading /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue';
import * as monaco from 'monaco-editor';
import { ElMessage } from 'element-plus';

// 配置 Monaco 编辑器 Web Worker 加载路径
if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorkerUrl: function (_, label) {
      return `https://cdn.jsdelivr.net/npm/monaco-editor@0.36.1/min/vs/${{
        html: 'html',
        css: 'css',
        javascript: 'ts',
        typescript: 'ts'
      }[label] || 'editor'}.worker.js`;
    }
  };
}

const props = defineProps({
  original: {
    type: String,
    required: true
  },
  modified: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'markdown',
    validator: v => ['markdown', 'html', 'javascript'].includes(v)
  }
});

const editorContainer = ref(null);
const diffEditor = shallowRef(null);
const loading = ref(false);
const resizeHandler = shallowRef(null);

// 创建 Monaco 编辑器模型（带缓存）
const modelCache = new Map();

const createModel = (content, language) => {
  const cacheKey = `${language}-${content}`;
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }

  const model = monaco.editor.createModel(
    content,
    language,
    monaco.Uri.parse(`file:///${Date.now()}.${language}`)
  );

  model.onWillDispose(() => modelCache.delete(cacheKey));
  modelCache.set(cacheKey, model);

  return model;
};

// 初始化 Monaco 差异编辑器
const initEditor = async () => {
  try {
    loading.value = true;
    await nextTick();

    if (!editorContainer.value) return;

    // 销毁旧实例
    if (diffEditor.value) {
      diffEditor.value.dispose();
    }

    diffEditor.value = monaco.editor.createDiffEditor(editorContainer.value, {
      automaticLayout: true,
      theme: 'vs-dark',
      readOnly: true,
      originalEditable: false,
      renderSideBySide: true,
      minimap: { enabled: true, scale: 2 },
      scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      lineNumbers: 'on',
      diffAlgorithm: 'smart',
      renderIndicators: true,
      ignoreTrimWhitespace: false
    });

    // 创建模型
    const originalModel = createModel(props.original, props.language);
    const modifiedModel = createModel(props.modified, props.language);

    // 绑定模型
    diffEditor.value.setModel({ original: originalModel, modified: modifiedModel });

    // 监听窗口大小变化
    resizeHandler.value = () => diffEditor.value.layout();
    window.addEventListener('resize', resizeHandler.value);
  } catch (error) {
    ElMessage.error(`编辑器初始化失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// 监听属性变化，重新初始化编辑器
watch(() => [props.original, props.modified, props.language], initEditor, { deep: true });

onMounted(initEditor);

onBeforeUnmount(() => {
  if (diffEditor.value) {
    diffEditor.value.dispose();
  }
  if (resizeHandler.value) {
    window.removeEventListener('resize', resizeHandler.value);
  }
});
</script>

<style scoped>
.diff-container {
  height: 80vh;
  width: 100%;
  background: #1e1e1e;
  position: relative;
}

.diff-editor {
  height: 100%;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loading-icon {
  font-size: 40px;
  color: #409eff;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 优化滚动条样式 */
:deep(.monaco-scrollable-element) {
  scrollbar-width: thin;
}

:deep(.monaco-scrollable-element)::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

:deep(.monaco-scrollable-element)::-webkit-scrollbar-thumb {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

:deep(.monaco-scrollable-element)::-webkit-scrollbar-thumb:hover {
  background-color: rgba(144, 147, 153, 0.5);
}
</style>
