import { createApp, watchEffect } from 'vue';

import { registerAccessDirective } from '@vben/access';
import { initTippy } from '@vben/common-ui';
import { MotionPlugin } from '@vben/plugins/motion';
import { preferences } from '@vben/preferences';
import {initStores, useAccessStore} from '@vben/stores';
import '@vben/styles';
import '@vben/styles/ele';

import { useTitle } from '@vueuse/core';
import {ElLoading, ElNotification} from 'element-plus';

import { $t, setupI18n } from '#/locales';

import { initComponentAdapter } from './adapter/component';
import App from './app.vue';
import { router } from './router';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import {useAuthStore} from './store';

import {MdEditor} from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import {DEFAULT_HOME_PATH, LOGIN_PATH} from '@vben/constants';

// 检查token是否有效，并执行相应操作
async function checkTokenAndRedirect(accessStore: any, authStore: any) {
  const currentPath = window.location.pathname;

  console.log('当前路径:', currentPath, '是否有token:', !!accessStore.accessToken);

  // 如果当前不在登录页，且没有token，则重定向到登录页
  if (!currentPath.includes(LOGIN_PATH) && !accessStore.accessToken) {
    console.log('未检测到有效token，跳转到登录页...');
    // 直接使用router实例，因为此时router已经初始化
    router.push(LOGIN_PATH);
    return false;
  }

  // 如果在登录页，但有token，尝试验证token有效性
  if (currentPath.includes(LOGIN_PATH) && accessStore.accessToken) {
    try {
      console.log('检测到token，验证中...');
      const userInfo = await authStore.fetchUserInfo();
      if (userInfo) {
        console.log('token有效，跳转到首页...');
        // 直接使用router实例，因为此时router已经初始化
        router.push(userInfo.homePath || DEFAULT_HOME_PATH);
        return false;
      }
    } catch (error) {
      console.error('Token无效，清除并留在登录页');
      // 清除所有store和localStorage的持久化数据
      await authStore.logout(false);

      // 强制清除localStorage中的token相关数据
      const appNamespace = import.meta.env.VITE_APP_NAMESPACE || 'vben';
      const env = import.meta.env.PROD ? 'prod' : 'dev';
      const appVersion = import.meta.env.VITE_APP_VERSION || '';
      const namespacePrefix = `${appNamespace}-${appVersion}-${env}`;

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(namespacePrefix) && key.includes('access')) {
          console.log('清除localStorage项:', key);
          localStorage.removeItem(key);
        }
      });
    }
  }

  return true;
}

async function bootstrap(namespace: string) {
  // 初始化组件适配器
  await initComponentAdapter();

  const app = createApp(App);

  // 注册Element Plus提供的v-loading指令
  app.directive('loading', ElLoading.directive);

  // 国际化 i18n 配置
  await setupI18n(app);

  // 配置 pinia-store
  await initStores(app, { namespace });

  // 从cookie中恢复token
  const authStore = useAuthStore();
  authStore.restoreFromCookie();

  // 配置路由及路由守卫 - 提前配置路由，以便checkTokenAndRedirect可以使用
  app.use(router);

  // 检查token有效性并处理路由
  const accessStore = useAccessStore();
  const shouldContinue = await checkTokenAndRedirect(accessStore, authStore);

  if (!shouldContinue) {
    return; // 如果需要重定向，则停止初始化
  }

  // 安装权限指令
  registerAccessDirective(app);

  // 初始化 tippy
  initTippy(app);

  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
  app.use(MdEditor)
  // 配置Motion插件
  app.use(MotionPlugin);

  // 动态更新标题
  watchEffect(() => {
    if (preferences.app.dynamicTitle) {
      const routeTitle = router.currentRoute.value.meta?.title;
      const pageTitle =
        (routeTitle ? `${$t(routeTitle)} - ` : '') + preferences.app.name;
      useTitle(pageTitle);
    }
  });

  app.mount('#app');
}

export { bootstrap };
