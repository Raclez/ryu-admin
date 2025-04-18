import type { UserInfo } from '@vben/types';
import type {PageParams, PageResult} from '#/api/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  /**
   * 用户查询参数
   */
  export interface UserQueryParams extends PageParams {
    /** 用户名关键字 */
    username?: string;
    /** 用户昵称关键字 */
    nickname?: string;
    /** 用户状态：0-禁用，1-启用 */
    status?: number;
    /** 角色ID */
    roleId?: string;
  }

  /**
   * 用户信息扩展
   */
  export interface UserDetail extends UserInfo {
    /** 用户角色IDs */
    roleIds?: string[];
    /** 用户角色名称列表 */
    roleNames?: string[];
    /** 部门ID */
    deptId?: string;
    /** 部门名称 */
    deptName?: string;
    /** 用户状态：0-禁用，1-启用 */
    status?: number;
    /** 最后登录时间 */
    lastLoginTime?: string;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /**
   * 创建/更新用户参数
   */
  export interface UserCreateParams {
    /** 用户ID(更新时需要) */
    id?: string;
    /** 用户名 */
    username: string;
    /** 密码(创建时必填) */
    password?: string;
    /** 昵称 */
    nickname?: string;
    /** 邮箱 */
    email?: string;
    /** 手机 */
    phone?: string;
    /** 角色IDs */
    roleIds?: string[];
    /** 部门ID */
    deptId?: string;
    /** 头像 */
    avatar?: string;
    /** 状态：0-禁用，1-启用 */
    status?: number;
    /** 备注 */
    remark?: string;
  }
}

/**
 * 获取当前登录用户信息
 * @returns 用户信息
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  return requestClient.get('/ryu-user/users/info');
}

/**
 * 获取用户分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getUserPageApi(params: UserApi.UserQueryParams): Promise<PageResult<UserApi.UserDetail>> {
  return requestClient.get('/ryu-user/users/page', {params});
}

/**
 * 获取用户详情
 * @param id 用户ID
 * @returns 用户详情
 */
export async function getUserDetailApi(id: string): Promise<UserApi.UserDetail> {
  return requestClient.get(`/ryu-user/users/${id}`);
}

/**
 * 创建用户
 * @param data 用户数据
 * @returns 创建结果
 */
export async function createUserApi(data: UserApi.UserCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/users', data);
}

/**
 * 更新用户
 * @param data 用户数据
 * @returns 更新结果
 */
export async function updateUserApi(data: UserApi.UserCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-user/users', data);
}

/**
 * 删除用户
 * @param id 用户ID
 * @returns 删除结果
 */
export async function deleteUserApi(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/users/${id}`);
}

/**
 * 批量删除用户
 * @param ids 用户ID数组
 * @returns 删除结果
 */
export async function batchDeleteUserApi(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-user/users/batch', ids);
}

/**
 * 修改密码
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 * @returns 修改结果
 */
export async function changePasswordApi(oldPassword: string, newPassword: string): Promise<boolean> {
  return requestClient.post('/ryu-user/users/password', {
    oldPassword,
    newPassword,
  });
}

/**
 * 重置用户密码
 * @param userId 用户ID
 * @param newPassword 新密码
 * @returns 重置结果
 */
export async function resetPasswordApi(userId: string, newPassword: string): Promise<boolean> {
  return requestClient.post('/ryu-user/users/reset-password', {
    userId,
    newPassword,
  });
}
