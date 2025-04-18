import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';

/**
 * 标签模块相关API接口定义
 * 提供博客标签的增删改查、分页查询等功能
 */
export namespace TagsApi {
  /**
   * 标签状态枚举
   */
  export enum TagStatus {
    /** 禁用状态 */
    DISABLED = 0,
    /** 启用状态 */
    ENABLED = 1
  }

  /**
   * 标签查询参数
   */
  export interface TagQueryParams extends PageParams {
    /** 标签名称关键字 */
    name?: string;
    /** 标签状态：0-禁用, 1-启用 */
    status?: TagStatus;
  }

  /**
   * 标签信息
   */
  export interface Tag {
    /** 标签ID */
    id: string;
    /** 标签名称 */
    name: string;
    /** 标签颜色，支持CSS颜色值 */
    color?: string;
    /** 标签描述 */
    description?: string;
    /** 标签图标，支持图标名称或自定义图标路径 */
    icon?: string;
    /** 排序权重，数字越小排序越靠前 */
    orderNo?: number;
    /** 状态：0-禁用, 1-启用 */
    status?: TagStatus;
    /** 创建时间，ISO格式日期字符串 */
    createTime?: string;
    /** 更新时间，ISO格式日期字符串 */
    updateTime?: string;
    /** 关联的文章数量 */
    articleCount?: number;
  }

  /**
   * 标签创建/更新参数
   */
  export interface TagCreateParams {
    /** 标签ID(更新时需要) */
    id?: string;
    /** 标签名称(必填) */
    name: string;
    /** 标签颜色，支持CSS颜色值 */
    color?: string;
    /** 标签描述 */
    description?: string;
    /** 标签图标，支持图标名称或自定义图标路径 */
    icon?: string;
    /** 排序权重，数字越小排序越靠前 */
    orderNo?: number;
    /** 状态：0-禁用, 1-启用 */
    status?: TagStatus;
  }
}

/**
 * 获取所有标签(列表)
 * @returns 标签列表数组
 */
export async function getAllTags(): Promise<TagsApi.Tag[]> {
  return requestClient.get('/ryu-content/tags/list');
}

/**
 * 获取标签分页列表
 * @param params 查询参数，支持分页、关键字搜索、状态筛选
 * @returns 分页数据结构，包含标签列表及分页信息
 */
export async function getTagsPage(params: TagsApi.TagQueryParams): Promise<PageResult<TagsApi.Tag>> {
  return requestClient.get('/ryu-content/tags/page', {params});
}

/**
 * 创建标签
 * @param data 标签创建参数
 * @returns 创建成功的标签ID
 */
export async function saveTags(data: TagsApi.TagCreateParams): Promise<string> {
  return requestClient.post('/ryu-content/tags/save', data);
}

/**
 * 删除标签
 * @param id 标签ID
 * @returns 删除结果，true表示成功
 */
export async function deleteTags(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-content/tags/delete/${id}`);
}

/**
 * 更新标签
 * @param data 标签更新参数（必须包含id字段）
 * @returns 更新结果，true表示成功
 */
export async function updateTags(data: TagsApi.TagCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-content/tags/edit', data);
}

/**
 * 批量删除标签
 * @param ids 要删除的标签ID数组
 * @returns 删除结果，true表示成功
 */
export async function batchDeleteTags(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-content/tags/batch', ids);
}
