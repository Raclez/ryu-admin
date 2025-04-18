import { requestClient } from '#/api/request';

/**
 * 文章模块相关API接口定义
 * 提供博客文章的增删改查、分页查询等功能
 */
export namespace PostsApi {
  /**
   * 文章状态枚举
   */
  export enum PostStatus {
    /** 草稿状态 */
    DRAFT = 0,
    /** 已发布状态 */
    PUBLISHED = 1,
  }

  /**
   * 文章查询参数
   */
  export interface PostQueryParams {
    /** 当前页码 */
    currentPage: number;
    /** 每页数量 */
    pageSize: number;
    /** 分类名称，用于按分类筛选 */
    categoryName?: string;
    /** 文章标题关键字，用于模糊搜索 */
    title?: string;
    /** 文章状态：0-草稿, 1-已发布 */
    status?: PostStatus;
    /** 标签ID，用于按标签筛选 */
    tagId?: string;
  }

  /**
   * 文章信息完整结构
   */
  export interface PostsItem {
    /** 文章唯一标识ID */
    id: string;
    /** 文章标题 */
    title: string;
    /** 文章内容，Markdown格式 */
    content?: string;
    /** 分类ID */
    categoryId?: string;
    /** 分类名称 */
    categoryName?: string;
    /** 文章摘要 */
    summary?: string;
    /** 标签ID列表 */
    tagIds?: string[];
    /** 标签名称列表 */
    tagNames?: string[];
    /** SEO标题 */
    seoTitle?: string;
    /** SEO描述 */
    seoDescription?: string;
    /** 封面图片ID */
    coverImageId?: string;
    /** 封面图片URL */
    coverImageUrl?: string;
    /** 创建时间，ISO格式日期字符串 */
    createTime?: string;
    /** 更新时间，ISO格式日期字符串 */
    updateTime?: string;
    /** 状态：0-草稿，1-已发布 */
    status?: PostStatus;
    /** 浏览量 */
    viewCount?: number;
    /** 点赞数 */
    likeCount?: number;
    /** 评论数 */
    commentCount?: number;
  }

  /**
   * 文章创建/更新参数
   */
  export interface PostCreateParams {
    /** 文章ID(更新时必须提供，创建时不需要) */
    id?: string;
    /** 文章标题(必填) */
    title: string;
    /** 文章内容，Markdown格式 */
    content?: string;
    /** 分类ID */
    categoryId?: string;
    /** 文章摘要 */
    summary?: string;
    /** 标签ID列表 */
    tagIds?: string[];
    /** SEO标题 */
    seoTitle?: string;
    /** SEO描述 */
    seoDescription?: string;
    /** 封面图片ID */
    coverImageId?: string;
    /** 状态：0-草稿，1-已发布 */
    status?: PostStatus;
  }

  /**
   * 文章分页查询结果
   */
  export interface PostsPageResult {
    /** 当前页的文章列表 */
    records: PostsItem[];
    /** 总记录数 */
    total: number;
    /** 每页大小 */
    size: number;
    /** 当前页码 */
    current: number;
  }
}

/**
 * 获取文章分页列表
 * @param params 查询参数，支持分页、关键字搜索、分类筛选等
 * @returns 分页数据结构，包含文章列表及分页信息
 */
export async function getPostsPage(params: PostsApi.PostQueryParams) {
  return requestClient.get<PostsApi.PostsPageResult>(
    '/ryu-content/posts/page',
    {params},
  );
}

/**
 * 保存文章（新增）
 * @param data 文章创建参数
 * @returns 创建成功的文章ID
 */
export async function savePosts(data: PostsApi.PostCreateParams) {
  return requestClient.post<string>('/ryu-content/posts/save', data);
}

/**
 * 批量删除文章
 * @param ids 要删除的文章ID数组
 * @returns 操作结果
 */
export async function batchDeletePosts(ids: string[]) {
  return requestClient.post('/ryu-content/posts/delete/batch', ids);
}

/**
 * 获取文章详情
 * @param id 文章ID
 * @returns 文章详细信息
 */
export async function getPostsDetail(id: string) {
  return requestClient.get<PostsApi.PostsItem>(
    `/ryu-content/posts/detail/${id}`,
  );
}

/**
 * 更新文章
 * @param data 文章更新参数（必须包含id字段）
 * @returns 更新结果，true表示成功
 */
export async function updatePosts(data: PostsApi.PostCreateParams) {
  return requestClient.put<boolean>('/ryu-content/posts/edit', data);
}
