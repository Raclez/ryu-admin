import { requestClient } from '#/api/request';

export async function getResourceGroups() {
  return requestClient.get('/ryu-files/resourceGroup/list');
}
