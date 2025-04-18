<script lang="ts" setup>
import {defineAsyncComponent} from 'vue';

// 异步加载组件以提高性能
const DictTypeList = defineAsyncComponent(() => import('./type/DictTypeList.vue'));
const DictItemList = defineAsyncComponent(() => import('./item/DictItemList.vue'));
</script>

<template>
  <router-view></router-view>
</template>
