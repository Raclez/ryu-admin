<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script lang="ts" setup>
import {onMounted, ref, watch, onBeforeUnmount, shallowRef} from "vue";
import * as monaco from "monaco-editor";
import type {editor} from "monaco-editor";

/**
 * Monaco编辑器容器引用
 */
const editorContainer = ref<HTMLElement | null>(null);

/**
 * 编辑器实例 - 使用shallowRef避免大对象的深层响应式监听
 */
const editorInstance = shallowRef<editor.IStandaloneCodeEditor | null>(null);

/**
 * 编辑器选项
 */
interface EditorOptions {
  /**
   * 编辑器内容
   */
  modelValue: string;

  /**
   * 编程语言
   */
  language: string;

  /**
   * 编辑器主题
   */
  theme: "vs" | "vs-dark" | "hc-black" | "hc-light";

  /**
   * 编辑器高度
   */
  height?: string | number;

  /**
   * 只读模式
   */
  readonly?: boolean;

  /**
   * 是否显示行号
   */
  lineNumbers?: boolean;

  /**
   * 是否显示缩略图
   */
  minimap?: boolean;
}

// 组件属性
const props = withDefaults(defineProps<{
  modelValue?: string;
  language?: string;
  theme?: "vs" | "vs-dark" | "hc-black" | "hc-light";
  height?: string | number;
  readonly?: boolean;
  lineNumbers?: boolean;
  minimap?: boolean;
}>(), {
  modelValue: "",
  language: "javascript",
  theme: "vs-dark",
  height: "400px",
  readonly: false,
  lineNumbers: true,
  minimap: true
});

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'editorDidMount', editor: editor.IStandaloneCodeEditor): void;
  (e: 'change', value: string): void;
}>();

/**
 * 初始化编辑器
 */
const initEditor = () => {
  if (!editorContainer.value) return;

  // 编辑器配置选项
  const options: editor.IStandaloneEditorConstructionOptions = {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
    readOnly: props.readonly,
    lineNumbers: props.lineNumbers ? 'on' : 'off',
    minimap: {
      enabled: props.minimap
    },
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    formatOnPaste: true,
    formatOnType: true,
    renderWhitespace: "selection",
    renderControlCharacters: true,
    fontLigatures: true,
  };

  // 创建编辑器实例
  editorInstance.value = monaco.editor.create(editorContainer.value, options);

  // 监听编辑器内容变化
  editorInstance.value.onDidChangeModelContent(() => {
    const value = editorInstance.value?.getValue() || "";
    emit("update:modelValue", value);
    emit("change", value);
  });

  // 通知父组件编辑器已挂载
  emit("editorDidMount", editorInstance.value);
};

/**
 * 设置编辑器值
 */
const setValue = (value: string) => {
  if (editorInstance.value && value !== editorInstance.value.getValue()) {
    editorInstance.value.setValue(value);
  }
};

/**
 * 调整编辑器大小
 */
const resize = () => {
  editorInstance.value?.layout();
};

/**
 * 聚焦编辑器
 */
const focus = () => {
  editorInstance.value?.focus();
};

/**
 * 获取编辑器实例
 */
const getEditor = (): editor.IStandaloneCodeEditor | null => {
  return editorInstance.value;
};

// 监听外部数据变化，更新编辑器内容
watch(() => props.modelValue, (newValue) => {
  setValue(newValue);
});

// 监听语言变化
watch(() => props.language, (newValue) => {
  if (editorInstance.value) {
    const model = editorInstance.value.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, newValue);
    }
  }
});

// 监听主题变化
watch(() => props.theme, (newValue) => {
  monaco.editor.setTheme(newValue);
});

// 监听只读状态变化
watch(() => props.readonly, (newValue) => {
  editorInstance.value?.updateOptions({readOnly: newValue});
});

// 组件挂载时初始化编辑器
onMounted(() => {
  initEditor();

  // 添加窗口大小变化监听
  window.addEventListener('resize', resize);
});

// 组件卸载前销毁编辑器实例
onBeforeUnmount(() => {
  if (editorInstance.value) {
    editorInstance.value.dispose();
    editorInstance.value = null;
  }

  // 移除窗口大小变化监听
  window.removeEventListener('resize', resize);
});

// 向父组件暴露的方法
defineExpose({
  resize,
  focus,
  getEditor
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: v-bind('typeof props.height === "number" ? `${props.height}px` : props.height');
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
}
</style>
