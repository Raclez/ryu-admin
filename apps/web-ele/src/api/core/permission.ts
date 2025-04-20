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
    identity?: string;
    /** 模块名称 */
    module?: string;
    /** 状态 */
    isActive?: number;
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
    identity: string;
    /** 模块名称 */
    module?: string;
    /** 状态(0-禁用,1-启用) */
    isActive?: number;
    /** 描述 */
    description?: string;
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
    identity: string;
    /** 模块名称 */
    module?: string;
    /** 状态(0-禁用,1-启用) */
    isActive?: number;
    /** 描述 */
    description?: string;
  }
}

/**
 * 获取所有权限列表
 * @returns 权限数据列表
 */
export async function getAllPermissions(): Promise<PermissionApi.Permission[]> {
  return requestClient.get('/ryu-user/permissions/list');
}

/**
 * 按模块获取权限列表
 * @param module 模块名称
 * @returns 权限数据列表
 */
export async function getPermissionsByModule(module: string): Promise<PermissionApi.Permission[]> {
  return requestClient.get(`/ryu-user/permissions/module/${module}`);
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
  return requestClient.post('/ryu-user/permissions/batch/delete', ids);
}

/**
 * 批量更新权限状态
 * @param ids 权限ID数组
 * @param isActive 状态(0-禁用,1-启用)
 * @returns 更新结果
 */
export async function batchUpdatePermissionStatus(ids: string[], isActive: number): Promise<boolean> {
  return requestClient.put('/ryu-user/permissions/status', {
    ids,
    isActive
  });
}

/**
 * 获取权限树
 * @returns 权限树
 */
export async function getPermissionTree(): Promise<PermissionApi.Permission[]> {
  return requestClient.get('/ryu-user/permissions/tree');
}

/**
 * 获取系统模块列表
 * @returns 模块列表
 */
export async function getSystemModules(): Promise<string[]> {
  return requestClient.get('/ryu-user/permissions/modules');
}

/**
 * 获取指定菜单的权限列表
 * @param menuId 菜单ID
 * @returns 权限列表
 */
export async function getPermissionsByMenuId(menuId: string): Promise<PermissionApi.Permission[]> {
  return requestClient.get(`/ryu-user/permissions/menu/${menuId}`);
}

/**
 * 获取指定角色的权限列表
 * @param roleId 角色ID
 * @returns 权限列表
 */
export async function getPermissionsByRoleId(roleId: string): Promise<PermissionApi.Permission[]> {
  return requestClient.get(`/ryu-user/permissions/role/${roleId}`);
}
