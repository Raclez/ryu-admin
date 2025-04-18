import { requestClient } from '#/api/request';
import type {PageParams, PageResult} from '#/api/types';

/**
 * 存储策略相关API
 */
export namespace StorageStrategyApi {
  /**
   * 存储策略查询参数
   */
  export interface StorageStrategyQueryParams extends PageParams {
    /** 策略名称关键字 */
    name?: string;
    /** 策略类型 */
    type?: string;
    /** 状态 */
    status?: number;
  }

  /**
   * 存储策略类型
   */
  export enum StorageType {
    /** 本地存储 */
    LOCAL = 'local',
    /** 阿里云OSS */
    ALIYUN_OSS = 'aliyun_oss',
    /** 腾讯云COS */
    TENCENT_COS = 'tencent_cos',
    /** 七牛云存储 */
    QINIU = 'qiniu',
    /** MinIO存储 */
    MINIO = 'minio',
    /** 华为云OBS */
    HUAWEI_OBS = 'huawei_obs',
    /** 亚马逊S3 */
    AWS_S3 = 's3'
  }

  /**
   * 存储策略信息
   */
  export interface StorageStrategy {
    /** 策略ID */
    id: string;
    /** 策略名称 */
    name: string;
    /** 策略类型 */
    type: StorageType;
    /** 是否为默认策略(0-否,1-是) */
    isDefault?: number;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 存储区域 */
    region?: string;
    /** 访问密钥ID */
    accessKey?: string;
    /** 访问密钥密码 */
    secretKey?: string;
    /** 存储桶名称 */
    bucket?: string;
    /** 存储桶域名 */
    domain?: string;
    /** 文件目录前缀 */
    prefixPath?: string;
    /** 自定义配置项 */
    customConfig?: string;
    /** 备注 */
    remark?: string;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
  }

  /**
   * 存储策略创建/更新参数
   */
  export interface StorageStrategyCreateParams {
    /** 策略ID(更新时需要) */
    id?: string;
    /** 策略名称 */
    name: string;
    /** 策略类型 */
    type: StorageType;
    /** 是否为默认策略(0-否,1-是) */
    isDefault?: number;
    /** 状态(0-禁用,1-启用) */
    status?: number;
    /** 存储区域 */
    region?: string;
    /** 访问密钥ID */
    accessKey?: string;
    /** 访问密钥密码 */
    secretKey?: string;
    /** 存储桶名称 */
    bucket?: string;
    /** 存储桶域名 */
    domain?: string;
    /** 文件目录前缀 */
    prefixPath?: string;
    /** 自定义配置项 */
    customConfig?: string;
    /** 备注 */
    remark?: string;
  }
}

/**
 * 获取存储策略分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getStorageStrategyPage(params: StorageStrategyApi.StorageStrategyQueryParams): Promise<PageResult<StorageStrategyApi.StorageStrategy>> {
  return requestClient.get('/ryu-files/storageConfigs/page', { params });
}

/**
 * 创建存储策略
 * @param data 存储策略数据
 * @returns 创建结果
 */
export async function saveStorageStrategy(data: StorageStrategyApi.StorageStrategyCreateParams): Promise<string> {
  return requestClient.post('/ryu-files/storageConfigs/add', data);
}

/**
 * 更新存储策略
 * @param data 存储策略数据
 * @returns 更新结果
 */
export async function updateStorageStrategy(data: StorageStrategyApi.StorageStrategyCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-files/storageConfigs/edit', data);
}

/**
 * 删除存储策略
 * @param id 存储策略ID
 * @returns 删除结果
 */
export async function deleteStorageStrategy(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-files/storageConfigs/delete/${id}`);
}

/**
 * 批量删除存储策略
 * @param ids 存储策略ID数组
 * @returns 删除结果
 */
export async function batchDeleteStorageStrategy(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-files/storageConfigs/batch', ids);
}

/**
 * 测试存储策略连接
 * @param data 存储策略数据
 * @returns 测试结果
 */
export async function testStorageStrategy(data: StorageStrategyApi.StorageStrategyCreateParams): Promise<boolean> {
  return requestClient.post('/ryu-files/storageConfigs/test', data);
}

/**
 * 获取默认存储策略
 * @returns 默认存储策略
 */
export async function getDefaultStorageStrategy(): Promise<StorageStrategyApi.StorageStrategy> {
  return requestClient.get('/ryu-files/storageConfigs/default');
}
