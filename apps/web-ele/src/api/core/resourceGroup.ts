import { requestClient } from '#/api/request';
import type {PageParams, PageResult} from '#/api/types';

/**
 * 资源分组相关API
 */
export namespace ResourceGroupApi {
  /**
   * 资源分组查询参数
   */
  export interface ResourceGroupQueryParams extends PageParams {
    /** 分组名称关键字 */
    name?: string;
    /** 状态 */
    status?: number;
  }

  /**
   * 资源分组信息
   */
  export interface ResourceGroup {
    /** 分组ID */
    id: string;
    /** 分组名称 */
    name: string;
    /** 分组描述 */
    description?: string;
    /** 排序 */
    orderNo?: number;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 资源数量 */
    resourceCount?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /**
   * 资源分组创建/更新参数
   */
  export interface ResourceGroupCreateParams {
    /** 分组ID(更新时需要) */
    id?: string;
    /** 分组名称 */
    name: string;
    /** 分组描述 */
    description?: string;
    /** 排序 */
    orderNo?: number;
    /** 状态(0-禁用,1-启用) */
    status?: number;
  }
}

/**
 * 获取所有资源分组
 * @returns 资源分组列表
 */
export async function getResourceGroups(): Promise<ResourceGroupApi.ResourceGroup[]> {
  return requestClient.get('/ryu-files/resourceGroup/list');
}

/**
 * 获取资源分组分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getResourceGroupPage(params: ResourceGroupApi.ResourceGroupQueryParams): Promise<PageResult<ResourceGroupApi.ResourceGroup>> {
  return requestClient.get('/ryu-files/resourceGroup/page', {params});
}

/**
 * 创建资源分组
 * @param data 资源分组数据
 * @returns 创建结果
 */
export async function createResourceGroup(data: ResourceGroupApi.ResourceGroupCreateParams): Promise<string> {
  return requestClient.post('/ryu-files/resourceGroup/save', data);
}

/**
 * 更新资源分组
 * @param data 资源分组数据
 * @returns 更新结果
 */
export async function updateResourceGroup(data: ResourceGroupApi.ResourceGroupCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-files/resourceGroup/edit', data);
}

/**
 * 删除资源分组
 * @param id 资源分组ID
 * @returns 删除结果
 */
export async function deleteResourceGroup(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-files/resourceGroup/delete/${id}`);
}

/**
 * 批量删除资源分组
 * @param ids 资源分组ID数组
 * @returns 删除结果
 */
export async function batchDeleteResourceGroup(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-files/resourceGroup/batch', ids);
}
