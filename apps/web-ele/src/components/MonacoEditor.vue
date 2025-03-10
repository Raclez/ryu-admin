<script setup>
import { onMounted, ref, watch } from "vue";
import * as monaco from "monaco-editor";

const editorContainer = ref(null);
const editorInstance = ref(null);
const props = defineProps({
  modelValue: String, // 绑定 v-model 的值
  language: {
    type: String,
    default: "javascript",
  },
  theme: {
    type: String,
    default: "vs-dark",
  },
});

const emit = defineEmits(["update:modelValue"]);

onMounted(() => {
  editorInstance.value = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language,
    theme: props.theme,
    automaticLayout: true,
  });

  // 监听编辑器内容变化
  editorInstance.value.onDidChangeModelContent(() => {
    emit("update:modelValue", editorInstance.value.getValue());
  });
});

// 监听外部数据变化，更新编辑器内容
watch(() => props.modelValue, (newValue) => {
  if (editorInstance.value && newValue !== editorInstance.value.getValue()) {
    editorInstance.value.setValue(newValue);
  }
});
</script>

<template>
  <div ref="editorContainer" style="width: 100%; height: 400px"></div>
</template>

<style scoped>
</style>
