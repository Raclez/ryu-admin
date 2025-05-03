import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';

// Cookie工具函数
const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string) => {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i] || '';
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; Max-Age=-99999999; path=/`;
};

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  // 不要在这里调用useRouter，而是在方法内部调用
  // const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: { username: string; password: string },
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      const { accessToken } = await loginApi(params);

      // 如果成功获取到 accessToken
      if (accessToken) {
        // 将 accessToken 存储到 cookie 中
        setCookie('accessToken', accessToken);

        // 还需要在 accessStore 中保存，因为应用中其他地方可能会从这里读取
        accessStore.setAccessToken(accessToken);

        userInfo = await fetchUserInfo();

        userStore.setUserInfo(userInfo);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else if (onSuccess) {
          await onSuccess();
        } else {
          try {
            // 在需要使用router时再获取router实例
            const router = useRouter();
            if (router && typeof router.push === 'function') {
              await router.push(userInfo?.homePath || DEFAULT_HOME_PATH);
            } else {
              console.warn('Router is not available, cannot navigate');
            }
          } catch (e) {
            console.error('Navigation error:', e);
          }
        }

        if (userInfo?.realName) {
          ElNotification({
            message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            title: $t('authentication.loginSuccess'),
            type: 'success',
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }

    // 删除Cookie中的token
    deleteCookie('accessToken');
    deleteCookie('refreshToken');

    resetAllStores();
    accessStore.setLoginExpired(false);

    if (redirect) {
      try {
        // 同样在需要时获取router
        const router = useRouter();
        if (router && typeof router.replace === 'function') {
          // 回登录页带上当前路由地址
          await router.replace({
            path: LOGIN_PATH,
            query: {
              redirect: encodeURIComponent(router.currentRoute.value.fullPath),
            },
          });
        }
      } catch (e) {
        console.error('Navigation error during logout:', e);
        // 如果无法导航，至少尝试通过window.location强制跳转
        window.location.href = LOGIN_PATH;
      }
    }
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  // 从cookie中检查并恢复token
  function restoreFromCookie() {
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      accessStore.setAccessToken(accessToken);
    }
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    restoreFromCookie
  };
});
