import { baseRequestClient, requestClient } from '#/api/request';
import type {ApiResponse} from '#/api/types';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password: string;
    username: string;
    /** 验证码 */
    captcha?: string;
    /** 记住登录状态 */
    rememberMe?: boolean;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    /** 访问令牌 */
    accessToken: string;
    /** 刷新令牌 (可能在cookie中) */
    refreshToken?: string;
    /** 令牌类型 */
    tokenType?: string;
    /** 过期时间(秒) */
    expiresIn?: number;
  }

  /** 刷新令牌返回结果 */
  export interface RefreshTokenResult {
    /** 新的访问令牌 */
    data: string;
    /** HTTP状态码 */
    status: number;
  }

  /** 用户验证码 */
  export interface CaptchaResult {
    /** 验证码图片(Base64) */
    image: string;
    /** 验证码ID */
    captchaId: string;
  }
}

/**
 * 登录接口
 * @param data 登录参数
 * @returns 登录结果
 */
export async function loginApi(data: AuthApi.LoginParams): Promise<AuthApi.LoginResult> {
  return requestClient.post('/ryu-user/auth/login', data);
}

/**
 * 刷新访问令牌
 * @description 用于token过期时自动调用
 * @returns 新的访问令牌
 */
export async function refreshTokenApi(): Promise<AuthApi.RefreshTokenResult> {
  return baseRequestClient.post('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 * @description 清除服务器端的令牌
 * @returns 操作结果
 */
export async function logoutApi(): Promise<boolean> {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 * @description 用于访问控制
 * @returns 权限码列表
 */
export async function getAccessCodesApi(): Promise<string[]> {
  return requestClient.get('/auth/codes');
}

/**
 * 获取验证码
 * @description 用于登录验证
 * @returns 验证码图片和ID
 */
export async function getCaptchaApi(): Promise<AuthApi.CaptchaResult> {
  return requestClient.get('/ryu-user/auth/captcha');
}
