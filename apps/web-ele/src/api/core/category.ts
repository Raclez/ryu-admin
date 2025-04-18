import type {PageParams, PageResult} from '#/api/types';
import {requestClient} from '#/api/request';

/**
 * 分类模块相关API接口定义
 * 提供博客/文章分类的增删改查、树形结构获取等功能
 */
export namespace CategoryApi {
  /**
   * 分类状态枚举
   */
  export enum CategoryStatus {
    /** 禁用状态 */
    DISABLED = 0,
    /** 启用状态 */
    ENABLED = 1
  }

  /**
   * 分类查询参数
   */
  export interface CategoryQueryParams extends PageParams {
    /** 分类名称关键字，用于模糊搜索 */
    name?: string;
    /** 分类状态：0-禁用，1-启用 */
    status?: CategoryStatus;
    /** 父级分类ID，用于筛选特定父级下的子分类 */
    parentId?: string;
  }

  /**
   * 分类信息完整结构
   */
  export interface Category {
    /** 分类唯一标识ID */
    id: string;
    /** 分类名称 */
    name: string;
    /** 分类描述信息 */
    description?: string;
    /** 分类图标，支持图标名称或URL */
    icon?: string;
    /** 父级分类ID，顶级分类为空 */
    parentId?: string;
    /** 排序权重，数字越小越靠前 */
    orderNo?: number;
    /** 状态：0-禁用，1-启用 */
    status?: CategoryStatus;
    /** 创建时间，ISO格式日期字符串 */
    createTime?: string;
    /** 更新时间，ISO格式日期字符串 */
    updateTime?: string;
    /** 该分类下的文章数量 */
    articleCount?: number;
    /** 子分类列表，用于树形结构 */
    children?: Category[];
    /** 分类完整路径（仅在某些接口中返回） */
    path?: string[];
    /** 是否为叶子节点（没有子分类） */
    isLeaf?: boolean;
  }

  /**
   * 分类创建/更新参数
   */
  export interface CategoryCreateParams {
    /** 分类ID(更新时必须提供，创建时不需要) */
    id?: string;
    /** 分类名称(必填) */
    name: string;
    /** 分类描述信息 */
    description?: string;
    /** 分类图标，支持图标名称或URL */
    icon?: string;
    /** 父级分类ID，不提供则为顶级分类 */
    parentId?: string;
    /** 排序权重，数字越小越靠前 */
    orderNo?: number;
    /** 状态：0-禁用，1-启用 */
    status?: CategoryStatus;
  }

  /**
   * 分类树形结构响应
   */
  export type CategoryTreeResult = Category[];

  /**
   * 分类分页查询结果
   */
  export type CategoryPageResult = PageResult<Category>;
}

/**
 * 获取分类分页列表
 * @param params 查询参数，支持分页、关键字搜索、状态筛选等
 * @returns 分页数据结构，包含分类列表及分页信息
 */
export async function getCategoryPage(params: CategoryApi.CategoryQueryParams): Promise<CategoryApi.CategoryPageResult> {
  return requestClient.get<CategoryApi.CategoryPageResult>('/ryu-content/category/page', {params});
}

/**
 * 获取分类详情
 * @param id 分类ID
 * @returns 分类详细信息
 */
export async function getCategoryDetail(id: string): Promise<CategoryApi.Category> {
  return requestClient.get<CategoryApi.Category>(`/ryu-content/category/${id}`);
}

/**
 * 创建分类
 * @param params 分类创建参数
 * @returns 创建成功的分类ID
 */
export async function createCategory(params: CategoryApi.CategoryCreateParams): Promise<string> {
  return requestClient.post<string>('/ryu-content/category/save', params);
}

/**
 * 更新分类
 * @param params 分类更新参数（必须包含id字段）
 * @returns 更新操作结果
 */
export async function updateCategory(params: CategoryApi.CategoryCreateParams): Promise<boolean> {
  return requestClient.put<boolean>('/ryu-content/category/edit', params);
}

/**
 * 删除分类
 * @param id 要删除的分类ID
 * @returns 操作结果
 */
export async function deleteCategory(id: string): Promise<boolean> {
  return requestClient.delete<boolean>(`/ryu-content/category/delete/${id}`);
}

/**
 * 批量删除分类
 * @param ids 要删除的分类ID数组
 * @returns 操作结果
 */
export async function batchDeleteCategory(ids: string[]): Promise<boolean> {
  return requestClient.post<boolean>('/ryu-content/category/batch', ids);
}

/**
 * 获取分类树形结构
 * @returns 树形结构的分类数据，顶级分类包含children字段表示子分类
 */
export async function getCategoryTree(): Promise<CategoryApi.CategoryTreeResult> {
  return requestClient.get<CategoryApi.CategoryTreeResult>('/ryu-content/category/tree');
}

/**
 * 获取所有分类(平铺结构)
 * @returns 所有分类的列表（非分页，一次性获取全部）
 */
export async function getAllCategory(): Promise<CategoryApi.Category[]> {
  return requestClient.get<CategoryApi.Category[]>('/ryu-content/category/all');
}
