import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/menu/all');
}

export async function getMenusByTree() {
  return requestClient.get('/ryu-user/menus/tree');
}

export async function saveMenu(data: any) {
  return requestClient.post('/ryu-user/menus/save', data);
}

export async function updateMenu(data: any) {
  return requestClient.put('/ryu-user/menus/edit', data);
}
export async function deleteMenu(id: string) {
  return requestClient.delete(`/ryu-user/menus/delete/${id}`);
}
