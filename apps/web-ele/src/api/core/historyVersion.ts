import {requestClient} from "#/api/request";

/**
 * 版本历史相关接口
 */

/**
 * 获取文章版本历史列表
 * @param postId 文章ID
 * @param params 查询参数
 * @returns Promise<Array<PostVersion>>
 */
export async function getVersions(postId: String, params: {
  cursor?: string;  // 最后一条记录的ID
  limit?: number;   // 每页数量
}) {
  return requestClient.get(`/ryu-content/postVersion/${postId}/versions`, {params});
}

/**
 * 获取指定版本详情
 * @param postId 文章ID
 * @param version 版本
 * @returns Promise<PostVersion>
 */
export function getVersion(postId: string, version: number) {
  return requestClient.get(`/ryu-content/postVersion/detail/${postId}/versions/${version}`)
}

//
// /**
//  * 恢复指定版本
//  * @param articleId 文章ID
//  * @param versionId 版本ID
//  * @returns Promise<void>
//  */
// export function restoreVersion(articleId: number, versionId: number) {
//   return request({
//     url: `/api/v1/articles/${articleId}/versions/${versionId}/restore`,
//     method: 'post'
//   });
// }
//
// /**
//  * 添加版本标签
//  * @param articleId 文章ID
//  * @param versionId 版本ID
//  * @param tag 标签名称
//  * @returns Promise<void>
//  */
// export function addTag(articleId: number, versionId: number, tag: string) {
//   return request({
//     url: `/api/v1/articles/${articleId}/versions/${versionId}/tags`,
//     method: 'post',
//     data: { tag }
//   });
// }
//
// /**
//  * 删除版本标签
//  * @param articleId 文章ID
//  * @param versionId 版本ID
//  * @param tag 标签名称
//  * @returns Promise<void>
//  */
// export function removeTag(articleId: number, versionId: number, tag: string) {
//   return request({
//     url: `/api/v1/articles/${articleId}/versions/${versionId}/tags/${tag}`,
//     method: 'delete'
//   });
// }
//
// /**
//  * 创建新版本
//  * @param articleId 文章ID
//  * @param data 版本数据
//  * @returns Promise<PostVersion>
//  */
// export function createVersion(articleId: number, data: {
//   content: string;
//   changeLog?: string;
//   tags?: string[];
// }) {
//   return request({
//     url: `/api/v1/articles/${articleId}/versions`,
//     method: 'post',
//     data
//   });
// }
//
// /**
//  * 版本历史接口类型定义
//  */
//
export interface PostVersion {
  id: string;
  postId: string;
  version: number;
  content: string;
  editor: number;
  changeLog: string;
  wordCount: number;
  createTime: string;
  isLatest: boolean;
  tags: string[];
  description?: string;
  duration?: string;
  modifyCount?: number;
}

// export interface VersionCreateRequest {
//   content: string;
//   changeLog?: string;
//   tags?: string[];
// }
//
// export interface VersionRestoreResponse {
//   success: boolean;
//   message: string;
// }
//
// export interface VersionTagRequest {
//   tag: string;
//   type?: 'danger' | 'success' | 'warning' | 'info';
// }
