import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';

/**
 * 权限相关API
 */
export namespace PermissionApi {
  /**
   * 权限查询参数
   */
  export interface PermissionQueryParams extends PageParams {
    /** 权限名称关键字 */
    name?: string;
    /** 权限标识关键字 */
    permission?: string;
    /** 菜单ID */
    menuId?: string;
    /** 状态 */
    status?: number;
  }

  /**
   * 权限信息
   */
  export interface Permission {
    /** 权限ID */
    id: string;
    /** 权限名称 */
    name: string;
    /** 权限标识 */
    permission: string;
    /** 菜单ID */
    menuId?: string;
    /** 菜单名称 */
    menuName?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 描述 */
    description?: string;
    /** 排序 */
    orderNo?: number;
    /** 权限类型(1-菜单,2-按钮,3-接口) */
    type?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /**
   * 权限创建/更新参数
   */
  export interface PermissionCreateParams {
    /** 权限ID(更新时需要) */
    id?: string;
    /** 权限名称 */
    name: string;
    /** 权限标识 */
    permission: string;
    /** 菜单ID */
    menuId?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 描述 */
    description?: string;
    /** 排序 */
    orderNo?: number;
    /** 权限类型(1-菜单,2-按钮,3-接口) */
    type?: number;
  }
}

/**
 * 获取权限分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getPermissionByCondition(params: PermissionApi.PermissionQueryParams): Promise<PageResult<PermissionApi.Permission>> {
  return requestClient.get('/ryu-user/permissions/page', {params});
}

/**
 * 添加权限
 * @param data 权限数据
 * @returns 创建结果
 */
export async function addPermission(data: PermissionApi.PermissionCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/permissions/add', data);
}

/**
 * 更新权限
 * @param data 权限数据
 * @returns 更新结果
 */
export async function updatePermission(data: PermissionApi.PermissionCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-user/permissions/edit', data);
}

/**
 * 删除权限
 * @param id 权限ID
 * @returns 删除结果
 */
export async function deletePermission(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/permissions/delete/${id}`);
}

/**
 * 批量删除权限
 * @param ids 权限ID数组
 * @returns 删除结果
 */
export async function batchDeletePermission(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-user/permissions/batch', ids);
}

/**
 * 获取权限树
 * @returns 权限树
 */
export async function getPermissionTree(): Promise<PermissionApi.Permission[]> {
  return requestClient.get('/ryu-user/permissions/tree');
}
