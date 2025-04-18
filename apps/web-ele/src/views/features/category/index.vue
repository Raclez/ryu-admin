<script lang="ts" setup>
import {defineAsyncComponent} from 'vue';

// 异步加载组件以提高性能
const CategoryList = defineAsyncComponent(() => import('./CategoryList.vue'));
</script>

<template>
  <router-view></router-view>
</template>
