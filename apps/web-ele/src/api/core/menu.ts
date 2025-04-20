import type { RouteRecordStringComponent } from '@vben/types';
import type {IdType, TreeNode} from '#/api/types';

import { requestClient } from '#/api/request';

export namespace MenuApi {
  /**
   * 菜单项类型
   */
  export interface MenuItem {
    /** 菜单ID */
    id: string;
    /** 菜单名称 */
    name: string;
    /** 菜单路径 */
    url: string;
    /** 组件路径 */
    component?: string;
    /** 图标 */
    icon?: string;
    /** 父级ID */
    parentId?: string;
    /** 排序 */
    sort?: number;
    /** 菜单类型(0-目录,1-菜单,2-按钮) */
    menuType?: number;
    /** 是否激活 */
    isActive?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 子菜单 */
    children?: MenuItem[];
  }

  /**
   * 菜单树节点
   */
  export interface MenuTreeNode extends TreeNode {
    /** 菜单ID */
    id: string;
    /** 菜单名称 */
    name: string;
    /** 菜单路径 */
    url?: string;
    /** 组件路径 */
    component?: string;
    /** 图标 */
    icon?: string;
    /** 父级ID */
    parentId?: string;
    /** 排序 */
    sort?: number;
    /** 菜单类型(0-目录,1-菜单,2-按钮) */
    menuType?: number;
    /** 是否激活 */
    isActive?: number;
    /** 子菜单 */
    children?: MenuTreeNode[];
  }

  /**
   * 菜单创建/更新参数
   */
  export interface MenuCreateParams {
    /** 菜单ID(更新时需要) */
    id?: string;
    /** 菜单名称 */
    name: string;
    /** 菜单路径 */
    url: string;
    /** 组件路径 */
    component?: string;
    /** 图标 */
    icon?: string;
    /** 父级ID */
    parentId?: string;
    /** 排序 */
    sort?: number;
    /** 菜单类型(0-目录,1-菜单,2-按钮) */
    menuType?: number;
    /** 是否激活 */
    isActive?: number;
  }
}

/**
 * 获取用户所有菜单
 * @description 获取当前登录用户可访问的所有菜单
 * @returns 路由菜单列表
 */
export async function getAllMenusApi(): Promise<MenuApi.MenuItem[]> {
  return requestClient.get('/ryu-user/menus/all');
}

/**
 * 获取菜单树形结构
 * @description 获取所有菜单的树形结构
 * @returns 菜单树
 */
export async function getMenusByTree(): Promise<MenuApi.MenuTreeNode[]> {
  return requestClient.get('/ryu-user/menus/tree');
}

/**
 * 创建菜单
 * @param data 菜单数据
 * @returns 创建结果，返回菜单ID
 */
export async function saveMenu(data: MenuApi.MenuCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/menus/save', data);
}

/**
 * 更新菜单
 * @param data 菜单数据
 * @returns 更新结果
 */
export async function updateMenu(data: MenuApi.MenuCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-user/menus/edit', data);
}

/**
 * 删除菜单
 * @param id 菜单ID
 * @returns 删除结果
 */
export async function deleteMenu(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/menus/delete/${id}`);
}

/**
 * 获取菜单详情
 * @param id 菜单ID
 * @returns 菜单详情
 */
export async function getMenuDetail(id: string): Promise<MenuApi.MenuItem> {
  return requestClient.get(`/ryu-user/menus/${id}`);
}

/**
 * 绑定权限到菜单
 * @param menuId 菜单ID
 * @param permissionIds 权限ID列表
 * @returns 绑定结果
 */
export async function bindPermissionsToMenu(menuId: string, permissionIds: string[]): Promise<boolean> {
  return requestClient.post(`/ryu-user/menus/bindPermissions?menuId=${menuId}`, permissionIds);
}

/**
 * 根据用户权限获取菜单
 * @param permissionIdentities 用户权限标识列表
 * @returns 菜单列表
 */
export async function getMenusByUserPermissions(permissionIdentities: string[]): Promise<MenuApi.MenuItem[]> {
  return requestClient.post('/ryu-user/menus/user', permissionIdentities);
}
