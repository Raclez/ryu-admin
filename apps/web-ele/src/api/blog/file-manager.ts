import {defHttp} from '/@/utils/http/axios';

enum Api {
  GetFileList = '/api/blog/file-manager/files',
  UploadFile = '/api/blog/file-manager/upload',
  CreateFolder = '/api/blog/file-manager/folder',
  RenameFile = '/api/blog/file-manager/rename',
  MoveFile = '/api/blog/file-manager/move',
  CopyFile = '/api/blog/file-manager/copy',
  DeleteFile = '/api/blog/file-manager/delete',
  GetStorageInfo = '/api/blog/file-manager/storage',
  DownloadFile = '/api/blog/file-manager/download',
}

// 文件列表参数
export interface FileListParams {
  folderId?: string | null;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 文件类型
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  url?: string;
  thumbnailUrl?: string;
}

// 存储信息
export interface StorageInfo {
  used: number;
  total: number;
  percentage: number;
}

// 创建文件夹参数
export interface CreateFolderParams {
  name: string;
  parentId: string | null;
}

// 重命名文件参数
export interface RenameFileParams {
  id: string;
  name: string;
}

// 移动文件参数
export interface MoveFileParams {
  id: string;
  targetFolderId: string | null;
}

// 复制文件参数
export interface CopyFileParams {
  id: string;
  targetFolderId: string | null;
}

// 文件列表结果
export interface FileListResult {
  items: FileItem[];
  total: number;
}

/**
 * 获取文件列表
 */
export function getFileList(params: FileListParams) {
  return defHttp.get<FileListResult>({url: Api.GetFileList, params});
}

/**
 * 获取存储信息
 */
export function getStorageInfo() {
  return defHttp.get<StorageInfo>({url: Api.GetStorageInfo});
}

/**
 * 创建文件夹
 */
export function createFolder(params: CreateFolderParams) {
  return defHttp.post<FileItem>({url: Api.CreateFolder, params});
}

/**
 * 重命名文件
 */
export function renameFile(params: RenameFileParams) {
  return defHttp.put<FileItem>({url: Api.RenameFile, params});
}

/**
 * 移动文件
 */
export function moveFile(params: MoveFileParams) {
  return defHttp.put<FileItem>({url: Api.MoveFile, params});
}

/**
 * 复制文件
 */
export function copyFile(params: CopyFileParams) {
  return defHttp.post<FileItem>({url: Api.CopyFile, params});
}

/**
 * 删除文件
 */
export function deleteFile(id: string) {
  return defHttp.delete<void>({url: `${Api.DeleteFile}/${id}`});
}

/**
 * 获取下载链接
 */
export function getDownloadUrl(id: string) {
  return `${Api.DownloadFile}/${id}`;
}

/**
 * 获取上传URL
 */
export function getUploadUrl() {
  return Api.UploadFile;
}
