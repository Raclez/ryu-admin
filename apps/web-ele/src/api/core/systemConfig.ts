import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';

/**
 * 系统配置相关API
 */
export namespace SystemConfigApi {
  /**
   * 系统配置查询参数
   */
  export interface SystemConfigQueryParams extends PageParams {
    /** 配置键名关键字 */
    configKey?: string;
    /** 配置名称关键字 */
    configName?: string;
    /** 配置分组 */
    groupCode?: string;
  }

  /**
   * 系统配置信息
   */
  export interface SystemConfig {
    /** 配置ID */
    id: string;
    /** 配置键名 */
    configKey: string;
    /** 配置键值 */
    configValue: string;
    /** 配置名称 */
    configName: string;
    /** 配置描述 */
    configDesc?: string;
    /** 分组编码 */
    groupCode?: string;
    /** 分组名称 */
    groupName?: string;
    /** 排序 */
    orderNo?: number;
    /** 是否系统内置(0-否,1-是) */
    isSystem?: number;
    /** 创建时间 */
    createTime?: string;
    /** 更新时间 */
    updateTime?: string;
    /** 配置类型(input、textarea、select等) */
    configType?: string;
    /** 配置选项(当类型为select时使用) */
    configOptions?: string;
  }

  /**
   * 系统配置创建/更新参数
   */
  export interface SystemConfigCreateParams {
    /** 配置ID(更新时需要) */
    id?: string;
    /** 配置键名 */
    configKey: string;
    /** 配置键值 */
    configValue: string;
    /** 配置名称 */
    configName: string;
    /** 配置描述 */
    configDesc?: string;
    /** 分组编码 */
    groupCode?: string;
    /** 排序 */
    orderNo?: number;
    /** 配置类型(input、textarea、select等) */
    configType?: string;
    /** 配置选项(当类型为select时使用) */
    configOptions?: string;
  }

  /**
   * 系统配置分组
   */
  export interface ConfigGroup {
    /** 分组编码 */
    groupCode: string;
    /** 分组名称 */
    groupName: string;
    /** 排序 */
    orderNo?: number;
  }
}

/**
 * 获取系统配置分页列表
 * @param params 查询参数
 * @returns 分页数据
 */
export async function getSystemConfigByPage(params: SystemConfigApi.SystemConfigQueryParams): Promise<PageResult<SystemConfigApi.SystemConfig>> {
  return requestClient.get('/ryu-user/sysConfig/page', {params});
}

/**
 * 添加系统配置
 * @param data 系统配置数据
 * @returns 创建结果
 */
export async function addSystemConfig(data: SystemConfigApi.SystemConfigCreateParams): Promise<string> {
  return requestClient.post('/ryu-user/sysConfig/save', data);
}

/**
 * 更新系统配置
 * @param data 系统配置数据
 * @returns 更新结果
 */
export async function updateSystemConfig(data: SystemConfigApi.SystemConfigCreateParams): Promise<boolean> {
  return requestClient.put('/ryu-user/sysConfig/edit', data);
}

/**
 * 删除系统配置
 * @param id 系统配置ID
 * @returns 删除结果
 */
export async function deleteSystemConfig(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-user/sysConfig/delete/${id}`);
}

/**
 * 批量删除系统配置
 * @param ids 系统配置ID数组
 * @returns 删除结果
 */
export async function batchDeleteSystemConfig(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-user/sysConfig/batch', ids);
}

/**
 * 获取系统配置分组
 * @returns 配置分组列表
 */
export async function getConfigGroups(): Promise<SystemConfigApi.ConfigGroup[]> {
  return requestClient.get('/ryu-user/sysConfig/groups');
}

/**
 * 根据键名获取配置值
 * @param configKey 配置键名
 * @returns 配置值
 */
export async function getConfigValueByKey(configKey: string): Promise<string> {
  return requestClient.get(`/ryu-user/sysConfig/value/${configKey}`);
}

/**
 * 获取所有配置
 * @returns 所有配置
 */
export async function getAllConfigs(): Promise<Record<string, string>> {
  return requestClient.get('/ryu-user/sysConfig/all');
}
