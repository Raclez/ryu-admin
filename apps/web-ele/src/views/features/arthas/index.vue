<script setup>
import {ref, provide} from 'vue';
import ArthasModule from './ArthasModule.vue';
import ArthasConsole from './ArthasConsole.vue';

const activeTab = ref('module'); // 'module' 或 'console'

const tabs = [
  {key: 'module', label: '功能模块'},
  {key: 'console', label: '命令控制台'}
];

const changeTab = (tabKey) => {
  activeTab.value = tabKey;
};

// 提供给子组件的方法
provide('changeTabToConsole', () => {
  activeTab.value = 'console';
});
</script>

<template>
  <div class="arthas-container">
    <div class="tab-header">
      <div class="tab-buttons">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          class="tab-button"
          @click="changeTab(tab.key)"
        >
          {{ tab.label }}
        </div>
      </div>
    </div>

    <div class="tab-content">
      <ArthasModule v-if="activeTab === 'module'"/>
      <ArthasConsole v-else-if="activeTab === 'console'"/>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.arthas-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);

  .tab-header {
    padding: 0 16px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);

    .tab-buttons {
      display: flex;

      .tab-button {
        padding: 16px 20px;
        font-size: 16px;
        cursor: pointer;
        position: relative;
        color: var(--el-text-color-regular);

        &.active {
          color: var(--el-color-primary);
          font-weight: 500;

          &:after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background-color: var(--el-color-primary);
          }
        }

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }

  .tab-content {
    flex: 1;
    overflow: auto;
    padding: 0;
  }
}
</style>
