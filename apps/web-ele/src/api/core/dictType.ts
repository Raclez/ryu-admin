import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';

/**
 * 字典类型相关API
 */
export namespace DictTypeApi {
  /**
   * 字典类型查询参数
   */
  export interface DictTypeQueryParams extends PageParams {
    /** 字典类型名称关键字 */
    name?: string;
    /** 字典类型编码关键字 */
    code?: string;
    /** 状态 */
    status?: number;
  }

  /**
   * 字典类型信息
   */
  export interface DictType {
    /** 字典类型ID */
    id: string;
    /** 字典类型名称 */
    name: string;
    /** 字典类型编码 */
    code: string;
    /** 字典类型描述 */
    description?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 排序 */
    orderNo?: number;
    /** 备注 */
    remark?: string;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /**
   * 字典类型创建/更新参数
   */
  export interface DictTypeCreateParams {
    /** 字典类型ID(更新时需要) */
    id?: string;
    /** 字典类型名称 */
    name: string;
    /** 字典类型编码 */
    code: string;
    /** 字典类型描述 */
    description?: string;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 排序 */
    orderNo?: number;
    /** 备注 */
    remark?: string;
  }
}

/**
 * 获取字典类型分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getDictTypePage(params: DictTypeApi.DictTypeQueryParams): Promise<PageResult<DictTypeApi.DictType>> {
  return requestClient.get('/ryu-user/sysDictType/page', {params});
}

/**
 * 获取所有字典类型
 * @returns 字典类型列表
 */
export async function getAllDictType(): Promise<DictTypeApi.DictType[]> {
  return requestClient.get('/ryu-user/sysDictType/list');
}

/**
 * 添加字典类型
 * @param data 字典类型数据
 * @returns 创建结果
 */
export async function addDictType(data: DictTypeApi.DictTypeCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/sysDictType/add', data);
}

/**
 * 更新字典类型
 * @param data 字典类型数据
 * @returns 更新结果
 */
export async function updateDictType(data: DictTypeApi.DictTypeCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-user/sysDictType/edit', data);
}

/**
 * 删除字典类型
 * @param id 字典类型ID
 * @returns 删除结果
 */
export async function deleteDictType(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/sysDictType/delete/${id}`);
}

/**
 * 批量删除字典类型
 * @param ids 字典类型ID数组
 * @returns 删除结果
 */
export async function batchDeleteDictType(ids: string[]): Promise<boolean> {
  return requestClient.post(`/ryu-user/sysDictType/delete/batch`, ids);
}
