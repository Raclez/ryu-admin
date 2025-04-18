/**
 * API类型定义文件
 */

/**
 * 通用分页查询参数
 */
export interface PageParams {
  currentPage: number;
  pageSize: number;
}

/**
 * 通用分页响应结果
 */
export interface PageResult<T> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages?: number;
}

/**
 * 通用API响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message?: string;
  success: boolean;
}

/**
 * 通用ID类型
 */
export type IdType = string | number;

/**
 * 通用ID对象类型
 */
export interface IdObject {
  id: IdType;
}

/**
 * 通用键值对
 */
export interface KeyValue {
  key: string;
  value: any;
  label?: string;
}

/**
 * 通用状态定义
 */
export enum CommonStatus {
  DISABLED = 0,
  ENABLED = 1,
  DELETED = 2,
}

/**
 * 通用时间范围类型
 */
export interface TimeRange {
  startTime?: string;
  endTime?: string;
}

/**
 * 通用树形节点接口
 */
export interface TreeNode {
  id: IdType;
  label: string;
  children?: TreeNode[];
  parentId?: IdType;

  [key: string]: any;
}

/**
 * 通用排序选项
 */
export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 通用查询条件
 */
export interface QueryCondition extends Partial<PageParams> {
  keyword?: string;
  status?: CommonStatus;
  sortBy?: SortOption;
  timeRange?: TimeRange;

  [key: string]: any;
}
