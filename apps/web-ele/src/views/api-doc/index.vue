<template>
  <div class="api-doc-container">
    <iframe
      :src="docUrl"
      class="api-doc-iframe"
      frameborder="0"
      height="100%"
      width="100%"
    ></iframe>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue';

// API文档地址
const docUrl = ref('http://localhost:7200/doc.html');
</script>

<style scoped>
.api-doc-container {
  width: 100%;
  height: calc(100vh - 100px); /* 根据布局调整高度 */
  overflow: hidden;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.api-doc-iframe {
  border: none;
}
</style>
