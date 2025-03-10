import { requestClient } from '#/api/request';

export async function getStorageStrategyPage(params: any) {
  return requestClient.get('/ryu-files/storageConfigs/page', { params });
}

export async function saveStorageStrategy(data: any) {
  return requestClient.post('/ryu-files/storageConfigs/add', data);
}

export async function updateStorageStrategy(data: any) {
  return requestClient.put('/ryu-files/storageConfigs/edit', data);
}

export async function deleteStorageStrategy(id: string) {
  return requestClient.delete(`/ryu-files/storageConfigs/delete/${id}`);
}
