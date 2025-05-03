/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import {ElMessage, ElNotification} from 'element-plus';

import { useAuthStore } from '#/store';
import {router} from '#/router';
import {LOGIN_PATH} from '@vben/constants';

import { refreshTokenApi } from './core';

// API响应状态码
export enum ApiErrorCode {
  SUCCESS = 200,
  AUTH_ERROR = 401,
  FORBIDDEN = 403,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

// 对应的错误信息映射
export const API_ERROR_MESSAGES: Record<number, string> = {
  [ApiErrorCode.AUTH_ERROR]: '身份验证失败，请重新登录',
  [ApiErrorCode.FORBIDDEN]: '权限不足，无法访问',
  [ApiErrorCode.BAD_REQUEST]: '请求参数错误',
  [ApiErrorCode.NOT_FOUND]: '请求的资源不存在',
  [ApiErrorCode.INTERNAL_ERROR]: '服务器内部错误',
};

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// Cookie工具函数 - 需要与auth.ts中一致
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

// 添加setCookie函数
const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}${expires}; path=/; SameSite=Lax`;
};

/**
 * 导航到登录页面
 * 优先使用Vue Router，失败时使用location.href
 */
function navigateToLogin() {
  try {
    // 尝试使用router进行导航
    if (router) {
      router.push(LOGIN_PATH);
    } else {
      window.location.href = LOGIN_PATH;
    }
  } catch (e) {
    console.warn('路由跳转失败，使用location:', e);
    window.location.href = LOGIN_PATH;
  }
}

/**
 * 创建请求客户端实例
 * @param baseURL 基础URL
 * @param options 配置选项
 * @returns RequestClient实例
 */
function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    timeout: 60000, // 默认60秒超时
  });

  /**
   * 重新认证逻辑
   * 当token失效或过期时调用
   */
  async function doReAuthenticate() {
    console.warn('Access token or refresh token is invalid or expired.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();

    // 立即清除token和状态
    accessStore.setAccessToken(null);
    accessStore.setLoginExpired(false);
    accessStore.setIsAccessChecked(false);

    // 清除cookie中的token
    document.cookie = `accessToken=; Max-Age=-99999999; path=/`;
    document.cookie = `refreshToken=; Max-Age=-99999999; path=/`;

    // 清除localStorage中的持久化数据
    const appNamespace = import.meta.env.VITE_APP_NAMESPACE || 'vben';
    const env = import.meta.env.PROD ? 'prod' : 'dev';
    const appVersion = import.meta.env.VITE_APP_VERSION || '';
    const namespacePrefix = `${appNamespace}-${appVersion}-${env}`;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(namespacePrefix) && (key.includes('access') || key.includes('user'))) {
        console.log('清除localStorage项:', key);
        localStorage.removeItem(key);
      }
    });

    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked &&
      window.location.pathname.includes('/dashboard')
    ) {
      // 在dashboard页面上使用模态框
      accessStore.setLoginExpired(true);
      ElNotification({
        type: 'error',
        title: '认证失败',
        message: '登录已过期，请重新登录',
        duration: 3000,
      });
    } else {
      // 直接使用重定向
      console.log('认证失败，正在重定向到登录页...');
      navigateToLogin();
    }
  }

  /**
   * 刷新token逻辑
   * 当access token过期但refresh token有效时调用
   * @returns 新的token或抛出异常
   */
  async function doRefreshToken(): Promise<string> {
    const accessStore = useAccessStore();
    try {
      const resp = await refreshTokenApi();
      const newToken = resp.data;
      // 更新store中的token
      accessStore.setAccessToken(newToken);
      // 同时更新cookie中的token
      setCookie('accessToken', newToken);
      return newToken;
    } catch (error) {
      console.error('刷新token失败', error);
      await doReAuthenticate();
      throw new Error('刷新token失败');
    }
  }

  /**
   * 格式化token
   * @param token 原始token
   * @returns 格式化后的token
   */
  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求拦截器 - 添加token和语言头
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      // 优先从cookie中获取token
      const tokenFromCookie = getCookie('accessToken');
      // 如果cookie中有token就使用cookie中的，否则使用store中的
      const tokenToUse = tokenFromCookie || accessStore.accessToken;

      // 如果没有token，且当前请求不是登录/注册等公开接口，则可能出现问题
      const isPublicApi = config.url?.includes('/auth/login') ||
        config.url?.includes('/auth/register') ||
        config.url?.includes('/captcha');

      if (!tokenToUse && !isPublicApi) {
        console.warn('请求需要认证但没有token，可能已经登出或token已过期');
        // 如果当前不在登录页，则跳转到登录页
        if (!window.location.pathname.includes('/auth/login')) {
          console.log('准备重定向到登录页...');
          navigateToLogin();
          // 取消请求
          return Promise.reject(new Error('无效的认证状态，请求已中断'));
        }
      }

      config.headers.Authorization = formatToken(tokenToUse);
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
    rejected: (error) => {
      console.error('请求错误:', error);
      return Promise.reject(error);
    },
  });

  // 响应拦截器 - 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: ApiErrorCode.SUCCESS,
    }),
  );

  // 响应拦截器 - token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 响应拦截器 - 通用的错误处理
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 获取详细的错误信息
      const responseData = error?.response?.data ?? {};
      const statusCode = error?.response?.status as number;
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      const defaultMessage = API_ERROR_MESSAGES[statusCode] || '请求失败';

      // 显示错误提示
      ElMessage.error(errorMessage || msg || defaultMessage);

      // 记录错误日志
      console.error('API请求错误:', {
        url: error?.config?.url,
        method: error?.config?.method,
        status: statusCode,
        message: errorMessage || msg || defaultMessage,
        data: responseData
      });
    }),
  );

  return client;
}

/**
 * 默认请求客户端
 * 返回data字段，自动处理错误信息
 */
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

/**
 * 基础请求客户端
 * 返回完整响应，需要手动处理错误
 */
export const baseRequestClient = new RequestClient({
  baseURL: apiURL,
  timeout: 60000
});
