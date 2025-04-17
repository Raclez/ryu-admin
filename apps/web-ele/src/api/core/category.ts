import {requestClient} from '#/api/request';

export async function getCategoryPage(params) {
  return requestClient.get('/ryu-content/categories/page', {params});
}
export async function updateCategory(data) {
  return requestClient.put('/ryu-content/categories/edit', data);
}
export async function addCategory(data) {
  return requestClient.post('/ryu-content/categories/save', data);
}
export async function deleteCategory(id) {
  return requestClient.delete(`/ryu-content/categories/delete/${id}`);
}
export async function getCategoryList() {
  return requestClient.get('/ryu-content/categories/list');
}
