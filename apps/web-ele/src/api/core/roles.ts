import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';
import type {PermissionApi} from './permission';

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
    isActive?: number;
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
    isActive?: number;
    /** 排序 */
    sort?: number;
    /** 是否默认角色(0-否,1-是) */
    isDefault?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 权限列表 */
    permissions?: PermissionApi.Permission[];
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
    isActive?: number;
    /** 排序 */
    sort?: number;
  }

  /**
   * 角色权限分配参数
   */
  export interface RolePermissionAssignParams {
    /** 角色ID */
    roleId: string;
    /** 权限ID列表 */
    permissionIds: string[];
  }

  /**
   * 角色权限详情
   */
  export interface RolePermissionDetail {
    /** 角色ID */
    roleId: string;
    /** 角色名称 */
    roleName: string;
    /** 权限列表 */
    permissions: PermissionApi.Permission[];
  }
}

/**
 * 获取角色分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getRoleByCondition(params: RolesApi.RoleQueryParams): Promise<PageResult<RolesApi.Role>> {
  return requestClient.get('/ryu-user/roles/page', {params});
}

/**
 * 获取所有角色列表（不分页）
 * @returns 角色列表
 */
export async function getAllRoles(): Promise<RolesApi.Role[]> {
  return requestClient.get('/ryu-user/roles/list');
}

/**
 * 添加角色
 * @param data 角色数据
 * @returns 创建结果
 */
export async function addRole(data: RolesApi.RoleCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/roles/add', data);
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
 * 获取角色详情
 * @param id 角色ID
 * @returns 角色详情
 */
export async function getRoleDetail(id: string): Promise<RolesApi.Role> {
  return requestClient.get(`/ryu-user/roles/get/${id}`);
}

/**
 * 获取角色权限
 * @param roleId 角色ID
 * @returns 权限详情
 */
export async function getRolePermissions(roleId: string): Promise<RolesApi.RolePermissionDetail> {
  return requestClient.get(`/ryu-user/roles/${roleId}/permissions`);
}

/**
 * 设置角色权限
 * @param params 角色权限分配参数
 * @returns 设置结果
 */
export async function assignRolePermissions(params: RolesApi.RolePermissionAssignParams): Promise<boolean> {
  return requestClient.post('/ryu-user/roles/assign-permissions', params);
}

/**
 * 删除角色权限
 * @param params 角色权限分配参数
 * @returns 删除结果
 */
export async function removeRolePermissions(params: RolesApi.RolePermissionAssignParams): Promise<boolean> {
  return requestClient.post('/ryu-user/roles/removePermission', params);
}

/**
 * 更新角色状态
 * @param roleId 角色ID
 * @param isActive 状态(0-禁用,1-启用)
 * @returns 更新结果
 */
export async function updateRoleStatus(roleId: string, isActive: number): Promise<boolean> {
  return requestClient.put('/ryu-user/roles/status', {
    roleId,
    isActive
  });
}

/**
 * 获取默认角色
 * @returns 默认角色
 */
export async function getDefaultRole(): Promise<RolesApi.Role> {
  return requestClient.get('/ryu-user/roles/default');
}

/**
 * 获取用户角色
 * @param userId 用户ID
 * @returns 角色列表
 */
export async function getUserRoles(userId: string): Promise<RolesApi.Role[]> {
  return requestClient.get(`/ryu-user/roles/user/${userId}`);
}

/**
 * 批量分配用户角色
 * @param userIds 用户ID列表
 * @param roleId 角色ID
 * @param assignBy 分配人ID
 * @returns 分配结果
 */
export async function batchAssignUserRoles(userIds: string[], roleId: string, assignBy: string): Promise<boolean> {
  return requestClient.post('/ryu-user/roles/batchAssign', {
    userIds,
    roleId,
    assignBy
  });
}
