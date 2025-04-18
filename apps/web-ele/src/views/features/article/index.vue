<script lang="ts" setup>
import {defineAsyncComponent} from 'vue';

// 异步加载组件以提高性能
const ArticleList = defineAsyncComponent(() => import('./ArticleList.vue'));
const ArticleEditor = defineAsyncComponent(() => import('./ArticleEditor.vue'));
const ArticleHistory = defineAsyncComponent(() => import('./ArticleHistory.vue'));
</script>

<template>
  <router-view></router-view>
</template>
