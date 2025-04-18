<script lang="ts" setup>
import {defineAsyncComponent} from 'vue';

// 异步加载组件以提高性能
const TagList = defineAsyncComponent(() => import('./TagList.vue'));
</script>

<template>
  <router-view></router-view>
</template>
