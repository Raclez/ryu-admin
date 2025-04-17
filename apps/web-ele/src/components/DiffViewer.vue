<template>
  <div class="diff-container">
    <div class="monaco-container">
      <div ref="editorContainer" class="diff-editor"></div>

      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading-icon">
          <Loading/>
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, watch, shallowRef, nextTick, defineExpose} from 'vue';
import * as monaco from 'monaco-editor';
import { ElMessage } from 'element-plus';
import {ArrowUp, ArrowDown, Loading} from '@element-plus/icons-vue';

// 配置 Monaco 编辑器
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
    default: 'markdown'
  },
  previousVersion: {
    type: Object,
    default: null
  },
  currentVersion: {
    type: Object,
    default: null
  },
  renderSideBySide: {
    type: Boolean,
    default: true
  }
});
const compareDialogVisible = ref(false);
const editorContainer = ref(null);
const diffEditor = shallowRef(null);
const loading = ref(false);
const resizeHandler = shallowRef(null);
const currentDiffIndex = ref(0);
const diffCount = ref(0);
const diffList = ref([]);
let controlsElement = null;
const controlsCreated = ref(false);

const emit = defineEmits(['diffLoaded', 'diffNavigated']);

// 更新差异信息
const updateDiffInfo = () => {
  if (!diffEditor.value) return;

  const lineChanges = diffEditor.value.getLineChanges();
  if (!lineChanges) {
    diffCount.value = 0;
    diffList.value = [];
    return;
  }

  diffList.value = lineChanges;
  diffCount.value = lineChanges.length;

  // 重置当前差异索引
  if (diffCount.value > 0 && currentDiffIndex.value >= diffCount.value) {
    currentDiffIndex.value = 0;
  }

  // 发射差异加载完成事件
  emit('diffLoaded', {
    diffCount: diffCount.value,
    totalLines: diffEditor.value.getModifiedEditor().getModel().getLineCount() || 0
  });
};

// 导航到下一个差异
const goToNextDiff = () => {
  if (diffCount.value === 0) return;

  if (currentDiffIndex.value < diffCount.value - 1) {
    currentDiffIndex.value++;
    jumpToDiff(currentDiffIndex.value);

    // 发射导航事件
    emitNavigationEvent();
  }
};

// 导航到上一个差异
const goToPreviousDiff = () => {
  if (diffCount.value === 0) return;

  if (currentDiffIndex.value > 0) {
    currentDiffIndex.value--;
    jumpToDiff(currentDiffIndex.value);

    // 发射导航事件
    emitNavigationEvent();
  }
};

// 发射导航事件
const emitNavigationEvent = () => {
  // 获取当前位置
  const currentEditor = diffEditor.value.getModifiedEditor();
  const position = currentEditor.getPosition();

  emit('diffNavigated', {
    currentIndex: currentDiffIndex.value,
    currentLine: position ? position.lineNumber : 1,
    currentColumn: position ? position.column : 1,
    totalDiffs: diffCount.value
  });
};

// 跳转到指定差异
const jumpToDiff = (index) => {
  if (!diffEditor.value || index < 0 || index >= diffList.value.length) return;

  const change = diffList.value[index];
  const modifiedEditor = diffEditor.value.getModifiedEditor();
  const originalEditor = diffEditor.value.getOriginalEditor();

  // 如果有修改行，跳到修改行，否则跳到原始行
  if (change.modifiedStartLineNumber > 0) {
    modifiedEditor.revealLineInCenter(change.modifiedStartLineNumber);
    modifiedEditor.setPosition({lineNumber: change.modifiedStartLineNumber, column: 1});

    // 高亮显示当前差异
    const decorations = modifiedEditor.createDecorationsCollection([
      {
        range: new monaco.Range(
          change.modifiedStartLineNumber,
          1,
          change.modifiedEndLineNumber,
          1
        ),
        options: {
          isWholeLine: true,
          className: 'current-diff-line',
          glyphMarginClassName: 'current-diff-glyph'
        }
      }
    ]);

    // 3秒后移除高亮
    setTimeout(() => {
      decorations.clear();
    }, 3000);

    modifiedEditor.focus();
  } else {
    originalEditor.revealLineInCenter(change.originalStartLineNumber);
    originalEditor.setPosition({lineNumber: change.originalStartLineNumber, column: 1});

    // 高亮显示当前差异
    const decorations = originalEditor.createDecorationsCollection([
      {
        range: new monaco.Range(
          change.originalStartLineNumber,
          1,
          change.originalEndLineNumber,
          1
        ),
        options: {
          isWholeLine: true,
          className: 'current-diff-line',
          glyphMarginClassName: 'current-diff-glyph'
        }
      }
    ]);

    // 3秒后移除高亮
    setTimeout(() => {
      decorations.clear();
    }, 3000);

    originalEditor.focus();
  }
};

// 修改版本标签显示方式，确保版本号在内容上面
const addVersionLabels = () => {
  if (!diffEditor.value) return;

  const originalEditor = diffEditor.value.getOriginalEditor();
  const modifiedEditor = diffEditor.value.getModifiedEditor();

  // 原始版本标签 - 固定在编辑器顶部
  originalEditor.createDecorationsCollection([
    {
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        isWholeLine: true,
        className: 'version-label-line',
        beforeContentClassName: 'version-label-container',
        before: {
          content: `原始版本: V${props.previousVersion?.version || '1.0'} (${formatDate(props.previousVersion?.createTime)})`,
          inlineClassName: 'version-label-before previous-version-label'
        }
      }
    }
  ]);

  // 当前版本标签 - 固定在编辑器顶部
  modifiedEditor.createDecorationsCollection([
    {
      range: new monaco.Range(1, 1, 1, 1),
      options: {
        isWholeLine: true,
        className: 'version-label-line',
        beforeContentClassName: 'version-label-container',
        before: {
          content: `当前版本: V${props.currentVersion?.version || '2.0'} (${formatDate(props.currentVersion?.createTime)})`,
          inlineClassName: 'version-label-before current-version-label'
        }
      }
    }
  ]);
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未知时间';

  // 如果已经是格式化的字符串，直接返回
  if (typeof date === 'string' && (date.includes('-') || date.includes('/'))) {
    return date;
  }

  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\//g, '-');
  } catch (e) {
    console.error('日期格式化错误', e);
    return String(date);
  }
};

// 添加操作按钮
const addActionButtons = () => {
  if (!diffEditor.value) return;

  const originalEditor = diffEditor.value.getOriginalEditor();
  const modifiedEditor = diffEditor.value.getModifiedEditor();

  // 添加快捷键导航差异的提示
  originalEditor.addAction({
    id: 'prev-diff',
    label: '上一个差异',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow],
    run: goToPreviousDiff
  });

  originalEditor.addAction({
    id: 'next-diff',
    label: '下一个差异',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow],
    run: goToNextDiff
  });

  modifiedEditor.addAction({
    id: 'prev-diff',
    label: '上一个差异',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow],
    run: goToPreviousDiff
  });

  modifiedEditor.addAction({
    id: 'next-diff',
    label: '下一个差异',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow],
    run: goToNextDiff
  });

  // 添加右键菜单
  originalEditor.addAction({
    id: 'context-menu-navigation',
    label: '差异导航',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: () => {
    } // 仅作为菜单组标题
  });

  originalEditor.addAction({
    id: 'context-menu-prev-diff',
    label: '上一个差异 (Ctrl+↑)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 2,
    run: goToPreviousDiff
  });

  originalEditor.addAction({
    id: 'context-menu-next-diff',
    label: '下一个差异 (Ctrl+↓)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 3,
    run: goToNextDiff
  });

  // 复制同样的菜单到修改编辑器
  modifiedEditor.addAction({
    id: 'context-menu-navigation',
    label: '差异导航',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: () => {
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-prev-diff',
    label: '上一个差异 (Ctrl+↑)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 2,
    run: goToPreviousDiff
  });

  modifiedEditor.addAction({
    id: 'context-menu-next-diff',
    label: '下一个差异 (Ctrl+↓)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 3,
    run: goToNextDiff
  });
};

// 添加更多键盘快捷键和右键菜单选项
const addMoreActions = () => {
  if (!diffEditor.value) return;

  const originalEditor = diffEditor.value.getOriginalEditor();
  const modifiedEditor = diffEditor.value.getModifiedEditor();

  // 首个和最后一个差异跳转
  originalEditor.addAction({
    id: 'first-diff',
    label: '跳到第一个差异 (Ctrl+Home)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Home],
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = 0;
        jumpToDiff(0);
      }
    }
  });

  originalEditor.addAction({
    id: 'last-diff',
    label: '跳到最后一个差异 (Ctrl+End)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.End],
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = diffCount.value - 1;
        jumpToDiff(diffCount.value - 1);
      }
    }
  });

  // 增加更多右键菜单
  originalEditor.addAction({
    id: 'context-menu-first-diff',
    label: '第一个差异 (Ctrl+Home)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = 0;
        jumpToDiff(0);
      }
    }
  });

  originalEditor.addAction({
    id: 'context-menu-last-diff',
    label: '最后一个差异 (Ctrl+End)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 4,
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = diffCount.value - 1;
        jumpToDiff(diffCount.value - 1);
      }
    }
  });

  // 复制到修改编辑器
  modifiedEditor.addAction({
    id: 'first-diff',
    label: '跳到第一个差异 (Ctrl+Home)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Home],
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = 0;
        jumpToDiff(0);
      }
    }
  });

  modifiedEditor.addAction({
    id: 'last-diff',
    label: '跳到最后一个差异 (Ctrl+End)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.End],
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = diffCount.value - 1;
        jumpToDiff(diffCount.value - 1);
      }
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-first-diff',
    label: '第一个差异 (Ctrl+Home)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 1,
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = 0;
        jumpToDiff(0);
      }
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-last-diff',
    label: '最后一个差异 (Ctrl+End)',
    contextMenuGroupId: 'navigation',
    contextMenuOrder: 4,
    run: () => {
      if (diffCount.value > 0) {
        currentDiffIndex.value = diffCount.value - 1;
        jumpToDiff(diffCount.value - 1);
      }
    }
  });
};

// 增加功能：添加搜索功能
const addSearchFunctionality = () => {
  if (!diffEditor.value) return;

  const originalEditor = diffEditor.value.getOriginalEditor();
  const modifiedEditor = diffEditor.value.getModifiedEditor();

  // 在原始编辑器添加搜索操作
  originalEditor.addAction({
    id: 'find-in-original',
    label: '在原始版本中搜索 (Ctrl+F)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
    run: (editor) => {
      editor.trigger('custom', 'actions.find', null);
    }
  });

  // 在修改编辑器添加搜索操作
  modifiedEditor.addAction({
    id: 'find-in-modified',
    label: '在当前版本中搜索 (Ctrl+F)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF],
    run: (editor) => {
      editor.trigger('custom', 'actions.find', null);
    }
  });
};

// 增加功能：添加字体大小调整
const addFontSizeControl = () => {
  if (!diffEditor.value) return;

  const originalEditor = diffEditor.value.getOriginalEditor();
  const modifiedEditor = diffEditor.value.getModifiedEditor();

  // 增加字体
  originalEditor.addAction({
    id: 'increase-font-size',
    label: '增大字体 (Ctrl++)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal],
    run: () => {
      const currentFontSize = diffEditor.value.getOriginalEditor().getOption(monaco.editor.EditorOption.fontSize);
      diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize + 2});
      diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize + 2});
    }
  });

  // 减小字体
  originalEditor.addAction({
    id: 'decrease-font-size',
    label: '减小字体 (Ctrl+-)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus],
    run: () => {
      const currentFontSize = diffEditor.value.getOriginalEditor().getOption(monaco.editor.EditorOption.fontSize);
      if (currentFontSize > 8) {
        diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize - 2});
        diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize - 2});
      }
    }
  });

  // 复制到修改编辑器
  modifiedEditor.addAction({
    id: 'increase-font-size',
    label: '增大字体 (Ctrl++)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal],
    run: () => {
      const currentFontSize = diffEditor.value.getModifiedEditor().getOption(monaco.editor.EditorOption.fontSize);
      diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize + 2});
      diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize + 2});
    }
  });

  modifiedEditor.addAction({
    id: 'decrease-font-size',
    label: '减小字体 (Ctrl+-)',
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus],
    run: () => {
      const currentFontSize = diffEditor.value.getModifiedEditor().getOption(monaco.editor.EditorOption.fontSize);
      if (currentFontSize > 8) {
        diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize - 2});
        diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize - 2});
      }
    }
  });

  // 添加到右键菜单
  originalEditor.addAction({
    id: 'context-menu-font-size',
    label: '字体大小',
    contextMenuGroupId: 'view',
    contextMenuOrder: 1,
    run: () => {
    }
  });

  originalEditor.addAction({
    id: 'context-menu-increase-font',
    label: '增大字体 (Ctrl++)',
    contextMenuGroupId: 'view',
    contextMenuOrder: 2,
    run: () => {
      const currentFontSize = diffEditor.value.getOriginalEditor().getOption(monaco.editor.EditorOption.fontSize);
      diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize + 2});
      diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize + 2});
    }
  });

  originalEditor.addAction({
    id: 'context-menu-decrease-font',
    label: '减小字体 (Ctrl+-)',
    contextMenuGroupId: 'view',
    contextMenuOrder: 3,
    run: () => {
      const currentFontSize = diffEditor.value.getOriginalEditor().getOption(monaco.editor.EditorOption.fontSize);
      if (currentFontSize > 8) {
        diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize - 2});
        diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize - 2});
      }
    }
  });

  // 复制到修改编辑器
  modifiedEditor.addAction({
    id: 'context-menu-font-size',
    label: '字体大小',
    contextMenuGroupId: 'view',
    contextMenuOrder: 1,
    run: () => {
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-increase-font',
    label: '增大字体 (Ctrl++)',
    contextMenuGroupId: 'view',
    contextMenuOrder: 2,
    run: () => {
      const currentFontSize = diffEditor.value.getModifiedEditor().getOption(monaco.editor.EditorOption.fontSize);
      diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize + 2});
      diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize + 2});
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-decrease-font',
    label: '减小字体 (Ctrl+-)',
    contextMenuGroupId: 'view',
    contextMenuOrder: 3,
    run: () => {
      const currentFontSize = diffEditor.value.getModifiedEditor().getOption(monaco.editor.EditorOption.fontSize);
      if (currentFontSize > 8) {
        diffEditor.value.getOriginalEditor().updateOptions({fontSize: currentFontSize - 2});
        diffEditor.value.getModifiedEditor().updateOptions({fontSize: currentFontSize - 2});
      }
    }
  });
};

// 增加功能：添加显示方式切换
const addViewModeToggle = () => {
  if (!diffEditor.value) return;

  const originalEditor = diffEditor.value.getOriginalEditor();
  const modifiedEditor = diffEditor.value.getModifiedEditor();

  // 切换显示模式
  originalEditor.addAction({
    id: 'toggle-view-mode',
    label: '切换视图模式 (Alt+V)',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyV],
    run: () => {
      const currentMode = diffEditor.value.getOption(monaco.editor.DiffEditorOption.renderSideBySide);
      diffEditor.value.updateOptions({renderSideBySide: !currentMode});
      ElMessage.info(`已切换到${!currentMode ? '并排' : '内联'}视图模式`);
    }
  });

  // 添加到右键菜单
  originalEditor.addAction({
    id: 'context-menu-view-mode',
    label: '显示模式',
    contextMenuGroupId: 'view',
    contextMenuOrder: 4,
    run: () => {
    }
  });

  originalEditor.addAction({
    id: 'context-menu-toggle-view',
    label: '切换并排/内联模式 (Alt+V)',
    contextMenuGroupId: 'view',
    contextMenuOrder: 5,
    run: () => {
      const currentMode = diffEditor.value.getOption(monaco.editor.DiffEditorOption.renderSideBySide);
      diffEditor.value.updateOptions({renderSideBySide: !currentMode});
      ElMessage.info(`已切换到${!currentMode ? '并排' : '内联'}视图模式`);
    }
  });

  // 复制到修改编辑器
  modifiedEditor.addAction({
    id: 'toggle-view-mode',
    label: '切换视图模式 (Alt+V)',
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyV],
    run: () => {
      const currentMode = diffEditor.value.getOption(monaco.editor.DiffEditorOption.renderSideBySide);
      diffEditor.value.updateOptions({renderSideBySide: !currentMode});
      ElMessage.info(`已切换到${!currentMode ? '并排' : '内联'}视图模式`);
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-view-mode',
    label: '显示模式',
    contextMenuGroupId: 'view',
    contextMenuOrder: 4,
    run: () => {
    }
  });

  modifiedEditor.addAction({
    id: 'context-menu-toggle-view',
    label: '切换并排/内联模式 (Alt+V)',
    contextMenuGroupId: 'view',
    contextMenuOrder: 5,
    run: () => {
      const currentMode = diffEditor.value.getOption(monaco.editor.DiffEditorOption.renderSideBySide);
      diffEditor.value.updateOptions({renderSideBySide: !currentMode});
      ElMessage.info(`已切换到${!currentMode ? '并排' : '内联'}视图模式`);
    }
  });
};

// 修改全局UI功能区，集成所有控制按钮
const createDiffControls = () => {
  // 不创建控制面板，使用父组件提供的控制面板
  console.log('跳过创建控制面板，使用父组件控制面板');

  // 只更新差异计数和按钮状态
  watch([diffCount, currentDiffIndex], () => {
    // 发射差异数量信息给父组件
    emit('diffLoaded', {
      diffCount: diffCount.value,
      totalLines: diffEditor.value?.getModifiedEditor().getModel().getLineCount() || 0,
      currentIndex: currentDiffIndex.value
    });

    // 发射导航事件
    emitNavigationEvent();
  });
};

// 初始化编辑器
const initEditor = async () => {
  if (!editorContainer.value) {
    console.error('编辑器容器不存在');
    return;
  }

  loading.value = true;

  try {
    // 调试信息
    console.log('开始初始化编辑器');
    console.log('容器元素:', editorContainer.value);
    console.log('原始内容长度:', props.original?.length || 0);
    console.log('修改内容长度:', props.modified?.length || 0);

    // 确保内容存在
    const originalContent = props.original || '没有原始内容';
    const modifiedContent = props.modified || '没有修改内容';

    // 给容器设置明确的尺寸和背景，方便调试
    editorContainer.value.style.width = '100%';
    editorContainer.value.style.height = '100%';
    editorContainer.value.style.minHeight = '500px';
    editorContainer.value.style.backgroundColor = 'rgba(40, 44, 52, 0.5)';

    // 创建差异编辑器
    diffEditor.value = monaco.editor.createDiffEditor(editorContainer.value, {
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: props.renderSideBySide,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      minimap: {enabled: true},
      theme: 'vs-dark',
      fontSize: 14,
      renderOverviewRuler: true,
      wordWrap: 'on',
      contextmenu: true,
      quickSuggestions: false,
      folding: true,
      matchBrackets: "always",
      renderWhitespace: "none",
      colorDecorators: true,
      "scrollbar.useShadows": true,
      "scrollbar.verticalScrollbarSize": 14,
      "scrollbar.horizontalScrollbarSize": 14,
      "editor.renderLineHighlight": "all",
      diffWordWrap: 'on',
      glyphMargin: true,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3
    });

    console.log('差异编辑器创建成功:', diffEditor.value);

    // 创建模型
    const originalModel = monaco.editor.createModel(
      originalContent,
      props.language,
      monaco.Uri.parse(`original-${Date.now()}.${props.language}`)
    );

    const modifiedModel = monaco.editor.createModel(
      modifiedContent,
      props.language,
      monaco.Uri.parse(`modified-${Date.now()}.${props.language}`)
    );

    console.log('模型创建成功');

    // 设置模型
    diffEditor.value.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    console.log('模型设置成功');

    // 添加按键监听
    window.addEventListener('keydown', handleKeyDown);

    // 监听窗口大小变化
    resizeHandler.value = () => {
      if (diffEditor.value) {
        diffEditor.value.layout();
        console.log('编辑器重新布局');
      }
    };
    window.addEventListener('resize', resizeHandler.value);

    // 在编辑器创建后确保添加功能和布局
    setTimeout(() => {
      console.log('添加版本标签');
      addVersionLabels();

      console.log('添加功能按钮');
      addActionButtons();
      addMoreActions();
      addSearchFunctionality();
      addFontSizeControl();
      addViewModeToggle();

      console.log('创建功能控制区');
      createDiffControls();

      console.log('更新差异信息');
      updateDiffInfo();

      // 自动滚动到第一个差异
      if (diffCount.value > 0) {
        jumpToDiff(0);
        // 发射导航事件
        emitNavigationEvent();
      }

      console.log('初始布局更新');
      if (diffEditor.value) {
        diffEditor.value.layout();
      }
    }, 500);

  } catch (error) {
    console.error('初始化编辑器失败:', error);
    ElMessage.error('编辑器初始化失败: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// 处理键盘事件
const handleKeyDown = (event) => {
  if (!diffEditor.value) return;

  // 使用方向键导航差异
  if (!event.ctrlKey && !event.altKey && !event.shiftKey) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      goToPreviousDiff();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      goToNextDiff();
    } else if (event.key === 'Escape') {
      // Esc键关闭对话框
      const event = new CustomEvent('close-diff-dialog');
      window.dispatchEvent(event);
    }
  }
};

// 监听属性变化
watch(() => [props.original, props.modified], async ([newOriginal, newModified]) => {
  console.log('属性变化-原始内容:', newOriginal ? newOriginal.substring(0, 30) + '...' : '无内容');
  console.log('属性变化-修改内容:', newModified ? newModified.substring(0, 30) + '...' : '无内容');

  // 如果编辑器还没初始化，先初始化
  if (!diffEditor.value) {
    await nextTick();
    initEditor();
    return;
  }

  // 更新模型内容
  try {
    const originalModel = diffEditor.value.getModel().original;
    const modifiedModel = diffEditor.value.getModel().modified;

    originalModel.setValue(newOriginal || '没有原始内容');
    modifiedModel.setValue(newModified || '没有修改内容');

    // 更新版本标签
    addVersionLabels();

    // 延迟更新差异信息
    setTimeout(() => {
      updateDiffInfo();

      // 自动滚动到第一个差异
      if (diffCount.value > 0) {
        jumpToDiff(0);
      }
    }, 300);
  } catch (error) {
    console.error('更新编辑器内容失败:', error);
  }
}, {deep: true});

// 监听 renderSideBySide 属性变化
watch(() => props.renderSideBySide, (newValue) => {
  if (diffEditor.value) {
    diffEditor.value.updateOptions({renderSideBySide: newValue});
  }
});

// 监听props变化时重新添加标签
watch(() => [props.previousVersion, props.currentVersion], () => {
  console.log('版本属性变化，重新添加标签');
  if (diffEditor.value) {
    addVersionLabels();
  }
}, {deep: true});

// 生命周期钩子
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
  console.log('添加了键盘事件监听');
  initEditor();
});

onBeforeUnmount(() => {
  if (diffEditor.value) {
    diffEditor.value.dispose();
  }

  if (resizeHandler.value) {
    window.removeEventListener('resize', resizeHandler.value);
  }

  window.removeEventListener('keydown', handleKeyDown);

  // 清理功能区
  if (controlsElement) {
    if (controlsElement.parentElement) {
      controlsElement.parentElement.removeChild(controlsElement);
    }
  }

  // 额外清理，防止遗漏
  const existingControls = document.querySelectorAll('.diff-controls-container');
  existingControls.forEach(control => {
    if (control && control.parentElement) {
      control.parentElement.removeChild(control);
    }
  });

  console.log('组件清理完成');
});

// 确保在对话框完全打开后调用更新布局
watch(() => compareDialogVisible, (newValue) => {
  if (newValue && diffEditor.value) {
    setTimeout(() => {
      diffEditor.value.layout();
      console.log('对话框打开后更新布局');
    }, 300);
  }
});

// 暴露方法给父组件
defineExpose({
  goToNextDiff,
  goToPreviousDiff,
  diffEditor
});
</script>

<style scoped>
.diff-container {
  height: 100% !important;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  width: 100%;
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
  border: none;
}

/* 取消旧导航区 */
.diff-navigation {
  display: none;
}

.monaco-container {
  flex: 1;
  height: 100%;
  min-height: 500px;
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 0;
  margin: 0;
  border: none;
}

.diff-editor {
  height: 100% !important;
  width: 100% !important;
  min-height: 500px;
  border: none !important;
}

/* 添加加载提示样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-icon {
  font-size: 32px;
  color: white;
}

/* 增强版本标签 */
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
  border-left: 5px solid #409EFF;
}

:deep(.current-version-label) {
  border-left: 5px solid #67C23A;
}

:deep(.version-label-line) {
  padding-top: 5px;
  padding-bottom: 5px;
  background-color: transparent;
}

/* 修改功能区样式 */
.diff-controls-container {
  position: relative;
  z-index: 10000;
  display: flex;
  flex-direction: row;
  gap: 15px;
  padding: 10px 15px;
  margin: 0;
  align-items: center;
  background-color: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navigation-group,
.view-group,
.font-size-group,
.advanced-group {
  display: flex;
  gap: 8px;
  padding: 0 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.diff-control-btn {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  min-width: 40px;
  justify-content: center;
  background-color: transparent;
}

.diff-control-btn:hover {
  transform: translateY(-1px);
  background-color: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.3);
}

.diff-control-btn:active {
  transform: translateY(0);
}

.diff-control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.diff-count-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 15px;
  border-radius: 6px;
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 优化差异高亮效果 */
:deep(.current-diff-line) {
  background: linear-gradient(90deg, rgba(0, 123, 255, 0.1), rgba(0, 123, 255, 0.2)) !important;
  border-left: 4px solid #007bff !important;
  animation: pulse-highlight 2s ease-in-out infinite;
}

@keyframes pulse-highlight {
  0% {
    background: linear-gradient(90deg, rgba(0, 123, 255, 0.1), rgba(0, 123, 255, 0.2)) !important;
  }
  50% {
    background: linear-gradient(90deg, rgba(0, 123, 255, 0.2), rgba(0, 123, 255, 0.3)) !important;
  }
  100% {
    background: linear-gradient(90deg, rgba(0, 123, 255, 0.1), rgba(0, 123, 255, 0.2)) !important;
  }
}

:deep(.current-diff-glyph) {
  background: linear-gradient(135deg, #007bff, #00bfff);
  border-radius: 50%;
  margin-left: 3px;
  box-shadow: 0 0 8px rgba(0, 123, 255, 0.5);
}

/* 优化差异行样式 */
:deep(.monaco-editor .line-insert) {
  border-left: 4px solid #2ecc71 !important;
  background: linear-gradient(90deg, rgba(46, 204, 113, 0.1), rgba(46, 204, 113, 0.2)) !important;
}

:deep(.monaco-editor .line-delete) {
  border-left: 4px solid #e74c3c !important;
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.1), rgba(231, 76, 60, 0.2)) !important;
}

:deep(.monaco-editor .char-insert) {
  border-bottom: 2px solid #2ecc71 !important;
  background: linear-gradient(90deg, rgba(46, 204, 113, 0.2), rgba(46, 204, 113, 0.3)) !important;
}

:deep(.monaco-editor .char-delete) {
  border-bottom: 2px solid #e74c3c !important;
  background: linear-gradient(90deg, rgba(231, 76, 60, 0.2), rgba(231, 76, 60, 0.3)) !important;
}
</style>
