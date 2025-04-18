import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';

/**
 * 角色相关API
 */
export namespace RolesApi {
  /**
   * 角色查询参数
   */
  export interface RoleQueryParams extends PageParams {
    /** 角色名称关键字 */
    name?: string;
    /** 角色编码关键字 */
    code?: string;
    /** 状态 */
    status?: number;
  }

  /**
   * 角色信息
   */
  export interface Role {
    /** 角色ID */
    id: string;
    /** 角色名称 */
    name: string;
    /** 角色编码 */
    code: string;
    /** 角色描述 */
    description?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 排序 */
    orderNo?: number;
    /** 数据权限类型(1-全部,2-自定义,3-本部门,4-本部门及子部门) */
    dataScope?: number;
    /** 是否系统内置(0-否,1-是) */
    isSystem?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 权限ID列表 */
    permissionIds?: string[];
    /** 菜单ID列表 */
    menuIds?: string[];
  }

  /**
   * 角色创建/更新参数
   */
  export interface RoleCreateParams {
    /** 角色ID(更新时需要) */
    id?: string;
    /** 角色名称 */
    name: string;
    /** 角色编码 */
    code: string;
    /** 角色描述 */
    description?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 排序 */
    orderNo?: number;
    /** 数据权限类型(1-全部,2-自定义,3-本部门,4-本部门及子部门) */
    dataScope?: number;
    /** 权限ID列表 */
    permissionIds?: string[];
    /** 菜单ID列表 */
    menuIds?: string[];
  }
}

/**
 * 获取角色分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getRolesByPage(params: RolesApi.RoleQueryParams): Promise<PageResult<RolesApi.Role>> {
  return requestClient.get('/ryu-user/roles/page', {params});
}

/**
 * 添加角色
 * @param data 角色数据
 * @returns 创建结果
 */
export async function addRole(data: RolesApi.RoleCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/roles/save', data);
}

/**
 * 更新角色
 * @param data 角色数据
 * @returns 更新结果
 */
export async function updateRole(data: RolesApi.RoleCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-user/roles/edit', data);
}

/**
 * 删除角色
 * @param id 角色ID
 * @returns 删除结果
 */
export async function deleteRole(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/roles/delete/${id}`);
}

/**
 * 批量删除角色
 * @param ids 角色ID数组
 * @returns 删除结果
 */
export async function batchDeleteRole(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-user/roles/batch', ids);
}

/**
 * 获取所有角色
 * @returns 角色列表
 */
export async function getAllRoles(): Promise<RolesApi.Role[]> {
  return requestClient.get('/ryu-user/roles/list');
}

/**
 * 获取角色权限
 * @param roleId 角色ID
 * @returns 权限ID列表
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  return requestClient.get(`/ryu-user/roles/permissions/${roleId}`);
}

/**
 * 设置角色权限
 * @param roleId 角色ID
 * @param permissionIds 权限ID列表
 * @returns 设置结果
 */
export async function setRolePermissions(roleId: string, permissionIds: string[]): Promise<boolean> {
  return requestClient.post('/ryu-user/roles/permissions', {
    roleId,
    permissionIds,
  });
}
