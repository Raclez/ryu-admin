import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DEFAULT_HOME_PATH, LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { ElNotification } from 'element-plus';
import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';
import { $t } from '#/locales';
import {router} from '#/router';

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

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * @param params 登录表单数据
   */
  async function authLogin(
    params: { username: string; password: string },
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      console.log('正在登录...');

      const { accessToken } = await loginApi(params);
      console.log('登录成功，获取到token');

      if (accessToken) {
        // 将 accessToken 存储到 cookie 中
        setCookie('accessToken', accessToken);
        console.log('token已保存到cookie');

        // 保存到store
        accessStore.setAccessToken(accessToken);
        console.log('token已保存到store');

        try {
          userInfo = await fetchUserInfo();
          console.log('获取用户信息成功:', userInfo?.realName || userInfo?.username);
          userStore.setUserInfo(userInfo);

          if (accessStore.loginExpired) {
            accessStore.setLoginExpired(false);
          } else if (onSuccess) {
            await onSuccess();
          } else {
            // 获取目标路径
            const targetPath = userInfo?.homePath || DEFAULT_HOME_PATH;
            console.log('准备跳转到:', targetPath);

            // 尝试使用路由实例进行导航
            try {
              router.push(targetPath);
            } catch (e) {
              console.warn('路由实例不可用，使用location.href:', e);
              window.location.href = targetPath;
            }
          }

          if (userInfo?.realName) {
            ElNotification({
              message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
              title: $t('authentication.loginSuccess'),
              type: 'success',
            });
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
          // 清除token
          accessStore.setAccessToken(null);
          deleteCookie('accessToken');
          deleteCookie('refreshToken');
          ElNotification({
            type: 'error',
            title: '登录失败',
            message: '获取用户信息失败，请重试',
            duration: 3000,
          });
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
      ElNotification({
        type: 'error',
        title: '登录失败',
        message: '用户名或密码错误',
        duration: 3000,
      });
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  /**
   * 退出登录
   */
  async function logout(redirect: boolean = true) {
    console.log('开始退出登录');
    try {
      await logoutApi();
      console.log('服务端登出成功');
    } catch (error) {
      console.error('服务端登出失败，但将继续本地登出', error);
    }

    // 删除Cookie中的token
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    console.log('已删除cookie中的token');

    // 重置所有状态
    resetAllStores();
    accessStore.setAccessToken(null);
    accessStore.setLoginExpired(false);
    accessStore.setIsAccessChecked(false);
    console.log('已重置所有store');

    // 清除localStorage中的持久化数据
    const appNamespace = import.meta.env.VITE_APP_NAMESPACE || 'vben';
    const env = import.meta.env.PROD ? 'prod' : 'dev';
    const appVersion = import.meta.env.VITE_APP_VERSION || '';
    const namespacePrefix = `${appNamespace}-${appVersion}-${env}`;

    // 清除所有Pinia持久化的数据
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(namespacePrefix)) {
        console.log('清除localStorage项:', key);
        localStorage.removeItem(key);
      }
    });

    // 清除其他可能存在的用户信息
    localStorage.removeItem('userInfo');
    sessionStorage.clear();

    if (redirect) {
      console.log('准备跳转到登录页');
      // 尝试使用路由实例进行导航
      try {
        router.push(LOGIN_PATH);
      } catch (e) {
        console.warn('路由实例不可用，使用location.href:', e);
        window.location.href = LOGIN_PATH;
      }
    }
  }

  /**
   * 获取用户信息
   */
  async function fetchUserInfo() {
    console.log('开始获取用户信息');
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfoApi();
    console.log('用户信息获取成功');
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  /**
   * 从cookie中检查并恢复token
   */
  function restoreFromCookie() {
    console.log('正在从cookie恢复token');
    const accessToken = getCookie('accessToken');
    if (accessToken) {
      console.log('从cookie中找到token');
      accessStore.setAccessToken(accessToken);
      return true;
    }
    console.log('cookie中没有找到token');
    return false;
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
