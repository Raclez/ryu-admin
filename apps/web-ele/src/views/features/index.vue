<script lang="ts" setup>
import {defineAsyncComponent} from 'vue';
import routes from './routes';

// 动态导入所有模块
const modules = import.meta.glob('./*/index.vue');
</script>

<template>
  <router-view></router-view>
</template>
