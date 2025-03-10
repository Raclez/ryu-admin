import { requestClient } from '#/api/request';

interface PostQueryParams {
  currentPage: number; // 当前页码
  pageSize: number; // 每页数量
  categoryName?: string;
  title?: string;
}
export async function getPostsPage(params: PostQueryParams) {
  return requestClient.get('/ryu-content/posts/page', { params });
}

export async function savePosts(data: any) {
  return requestClient.post('/ryu-content/posts/save', data);
}

export async function batchDeletePosts(data: any) {
  return requestClient.post('/ryu-content/posts/delete/batch', data);
}

export async function getPostsDetail(id: string) {
  return requestClient.get(`/ryu-content/posts/detail/${id}`);
}

export async function updatePosts(data: any) {
  return requestClient.put('/ryu-content/posts/edit', data);
}
