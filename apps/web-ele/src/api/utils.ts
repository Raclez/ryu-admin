import type {PageParams, PageResult} from './types';
import {requestClient} from './request';

/**
 * API工具函数
 * 提供通用的CRUD操作封装
 */

/**
 * 创建通用CRUD API
 * @param baseUrl API基础路径
 * @returns CRUD API对象
 */
export function createCrudApi<T, P extends PageParams = PageParams, C = Partial<T>>(baseUrl: string) {
  return {
    /**
     * 获取分页列表
     * @param params 查询参数
     * @returns 分页数据
     */
    getPage(params: P): Promise<PageResult<T>> {
      return requestClient.get(`${baseUrl}/page`, {params});
    },

    /**
     * 获取所有数据(不分页)
     * @returns 数据列表
     */
    getAll(): Promise<T[]> {
      return requestClient.get(`${baseUrl}/all`);
    },

    /**
     * 获取详情
     * @param id 记录ID
     * @returns 详情数据
     */
    getDetail(id: string): Promise<T> {
      return requestClient.get(`${baseUrl}/${id}`);
    },

    /**
     * 创建记录
     * @param data 创建数据
     * @returns 创建结果
     */
    create(data: C): Promise<string> {
      return requestClient.post(`${baseUrl}`, data);
    },

    /**
     * 更新记录
     * @param data 更新数据
     * @returns 更新结果
     */
    update(data: C & { id: string }): Promise<boolean> {
      return requestClient.put(`${baseUrl}`, data);
    },

    /**
     * 删除记录
     * @param id 记录ID
     * @returns 删除结果
     */
    delete(id: string): Promise<boolean> {
      return requestClient.delete(`${baseUrl}/${id}`);
    },

    /**
     * 批量删除
     * @param ids ID数组
     * @returns 删除结果
     */
    batchDelete(ids: string[]): Promise<boolean> {
      return requestClient.post(`${baseUrl}/batch`, ids);
    },

    /**
     * 自定义GET请求
     * @param path 路径
     * @param params 查询参数
     * @returns 请求结果
     */
    get<R = any>(path: string, params?: Record<string, any>): Promise<R> {
      return requestClient.get(`${baseUrl}${path}`, {params});
    },

    /**
     * 自定义POST请求
     * @param path 路径
     * @param data 请求数据
     * @returns 请求结果
     */
    post<R = any>(path: string, data?: any): Promise<R> {
      return requestClient.post(`${baseUrl}${path}`, data);
    },

    /**
     * 自定义PUT请求
     * @param path 路径
     * @param data 请求数据
     * @returns 请求结果
     */
    put<R = any>(path: string, data?: any): Promise<R> {
      return requestClient.put(`${baseUrl}${path}`, data);
    }
  };
}

/**
 * 处理API请求错误
 * @param error 错误对象
 * @param fallback 错误时的默认返回值
 * @returns 处理结果
 */
export function handleApiError<T>(error: any, fallback: T): T {
  console.error('API请求错误:', error);
  return fallback;
}

/**
 * 安全执行API请求
 * @param apiPromise API请求Promise
 * @param fallback 错误时的默认返回值
 * @returns 处理结果
 */
export async function safeApiCall<T>(apiPromise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await apiPromise;
  } catch (error) {
    return handleApiError(error, fallback);
  }
}
