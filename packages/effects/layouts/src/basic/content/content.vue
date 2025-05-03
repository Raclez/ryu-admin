<script lang="ts" setup>
import type { VNode } from 'vue';
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationNormalizedLoadedGeneric,
} from 'vue-router';

import { RouterView } from 'vue-router';

import {preferences} from '@vben/preferences';

import { IFrameRouterView } from '../../iframe';

defineOptions({ name: 'LayoutContent' });

// 页面切换动画
function getTransitionName(_route: RouteLocationNormalizedLoaded) {
  // 如果偏好设置未设置，则不使用动画
  const {transition} = preferences;
  const transitionName = transition.name;
  if (!transitionName || !transition.enable) {
    return;
  }

  return transitionName;
}

/**
 * 转换组件，自动添加 name
 * @param component
 */
function transformComponent(
  component: VNode,
  route: RouteLocationNormalizedLoadedGeneric,
) {
  // 组件视图未找到，如果有设置后备视图，则返回后备视图，如果没有，则抛出错误
  if (!component) {
    console.error(
      'Component view not found，please check the route configuration',
    );
    return undefined;
  }

  // 确保路由组件总是能被正确渲染，不管是否有name
  return component;
}
</script>

<template>
  <div class="relative h-full">
    <IFrameRouterView />
    <RouterView v-slot="{ Component, route }">
      <Transition :name="getTransitionName(route)" appear mode="out-in">
        <component
          :is="transformComponent(Component, route)"
          :key="route.fullPath"
        />
      </Transition>
    </RouterView>
  </div>
</template>
