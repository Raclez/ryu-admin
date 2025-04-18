import {requestClient} from "#/api/request";
import type {PageParams, PageResult} from '#/api/types';
import type {AxiosProgressEvent} from 'axios';

/**
 * 文件资源相关API
 */
export namespace ResourceApi {
  /**
   * 文件资源状态枚举
   */
  export enum ResourceStatus {
    /** 禁用状态 */
    DISABLED = 0,
    /** 启用状态 */
    ENABLED = 1
  }

  /**
   * 文件类型枚举
   */
  export enum ResourceType {
    /** 图片文件 */
    IMAGE = 'image',
    /** 文档文件 */
    DOCUMENT = 'document',
    /** 视频文件 */
    VIDEO = 'video',
    /** 音频文件 */
    AUDIO = 'audio',
    /** 其他类型文件 */
    OTHER = 'other'
  }

  /**
   * 文件查询参数
   */
  export interface FileQueryParams extends PageParams {
    /** 文件名称 */
    fileName?: string;
    /** 文件类型 */
    fileType?: string;
    /** 资源分组ID */
    groupId?: string;
    /** 文件状态 */
    status?: ResourceStatus;
  }

  /**
   * 文件资源项
   */
  export interface FileResource {
    /** 文件ID */
    id: string;
    /** 文件名称 */
    fileName: string;
    /** 文件路径 */
    filePath: string;
    /** 文件大小(字节) */
    fileSize: number;
    /** 文件类型 */
    fileType: string;
    /** 创建时间 */
    createTime: string;
    /** 更新时间 */
    updateTime?: string;
    /** 资源分组ID */
    groupId?: string;
    /** 资源分组名称 */
    groupName?: string;
    /** 文件访问URL */
    fileUrl?: string;
    /** 文件状态 */
    status?: ResourceStatus;
  }

  /**
   * 上传文件结果
   */
  export interface UploadResult {
    /** 文件ID */
    id: string;
    /** 文件名称 */
    fileName: string;
    /** 文件路径 */
    filePath: string;
    /** 文件访问URL */
    fileUrl: string;
    /** 文件大小(字节) */
    fileSize: number;
    /** 文件类型 */
    fileType: string;
  }
}

/**
 * 获取文件资源分组列表
 * @param params 查询参数
 * @returns 文件资源分页数据
 */
export async function getFilesGroup(params: ResourceApi.FileQueryParams): Promise<PageResult<ResourceApi.FileResource>> {
  return requestClient.get('/ryu-files/files/group', {params});
}

/**
 * 上传文件
 * @param formData 包含文件的FormData对象
 * @param onProgress 上传进度回调函数
 * @returns 上传结果信息
 */
export async function uploadFile(
  formData: FormData,
  onProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<ResourceApi.UploadResult> {
  return requestClient.post('/ryu-files/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: onProgress
  });
}

/**
 * 删除文件
 * @param id 文件资源ID
 * @returns 是否删除成功
 */
export async function deleteFile(id: string): Promise<boolean> {
  return requestClient.delete(`/ryu-files/files/${id}`);
}

/**
 * 批量删除文件
 * @param ids 文件资源ID数组
 * @returns 是否删除成功
 */
export async function batchDeleteFiles(ids: string[]): Promise<boolean> {
  return requestClient.post('/ryu-files/files/batch-delete', {ids});
}
