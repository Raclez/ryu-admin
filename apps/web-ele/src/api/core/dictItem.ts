import type {PageParams, PageResult} from '#/api/types';

import {requestClient} from '#/api/request';

/**
 * 字典项相关API
 */
export namespace DictItemApi {
  /**
   * 字典项查询参数
   */
  export interface DictItemQueryParams extends PageParams {
    /** 字典类型编码 */
    dictTypeCode?: string;
    /** 字典类型ID */
    dictTypeId?: string;
    /** 字典项关键字 */
    keyword?: string;
    /** 状态 */
    status?: number;
  }

  /**
   * 字典项
   */
  export interface DictItem {
    /** 字典项ID */
    id: string;
    /** 字典类型ID */
    dictTypeId: string;
    /** 字典类型编码 */
    dictTypeCode?: string;
    /** 字典项标签 */
    label: string;
    /** 字典项值 */
    value: string;
    /** 排序 */
    orderNo?: number;
    /** 字典项描述 */
    description?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 样式属性 */
    cssClass?: string;
    /** 表格回显样式 */
    listClass?: string;
    /** 是否默认(0-否,1-是) */
    isDefault?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /**
   * 字典项创建/更新参数
   */
  export interface DictItemCreateParams {
    /** 字典项ID(更新时需要) */
    id?: string;
    /** 字典类型ID */
    dictTypeId: string;
    /** 字典项标签 */
    label: string;
    /** 字典项值 */
    value: string;
    /** 排序 */
    orderNo?: number;
    /** 字典项描述 */
    description?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 样式属性 */
    cssClass?: string;
    /** 表格回显样式 */
    listClass?: string;
    /** 是否默认(0-否,1-是) */
    isDefault?: number;
  }
}

/**
 * 获取字典项列表
 * @param params 查询参数
 * @returns 字典项列表
 */
export async function getDictItemList(
  params: DictItemApi.DictItemQueryParams,
): Promise<PageResult<DictItemApi.DictItem>> {
  return requestClient.get('/ryu-user/sysDictItem/getDictItems', {params});
}

/**
 * 添加字典项
 * @param data 字典项数据
 * @returns 创建结果
 */
export async function addDictItem(
  data: DictItemApi.DictItemCreateParams,
): Promise<string> {
  return requestClient.post('/ryu-user/sysDictItem/save', data);
}

/**
 * 更新字典项
 * @param data 字典项数据
 * @returns 更新结果
 */
export async function updateDictItem(
  data: DictItemApi.DictItemCreateParams,
): Promise<boolean> {
  return requestClient.put('/ryu-user/sysDictItem/edit', data);
}

/**
 * 删除字典项
 * @param id 字典项ID
 * @returns 删除结果
 */
export async function deleteDictItem(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/sysDictItem/delete/${id}`);
}

/**
 * 根据条件获取字典项
 * @param params 字典类型编码
 * @returns 字典项列表
 */
export async function getDictItemsByCondition(
  params: string,
): Promise<DictItemApi.DictItem[]> {
  return requestClient.get('/ryu-user/sysDictItem/condition', {
    params,
  });
}

/**
 * 批量删除字典项
 * @param ids 字典项ID数组
 * @returns 删除结果
 */
export async function batchDeleteDictItems(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-user/sysDictItem/batch', ids);
}
