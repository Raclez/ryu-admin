import {requestClient} from "#/api/request";

export async function getSystemConfigByPage(params) {
  return requestClient.get('/ryu-user/sysConfig/page', {params});
}

export async function addSystemConfig(data) {
  return requestClient.post('/ryu-user/sysConfig/save', data);
}

export async function updateSystemConfig(data) {
  return requestClient.put('/ryu-user/sysConfig/edit', data);
}

export async function deleteSystemConfig(id) {
  return requestClient.delete(`/ryu-user/sysConfig/delete/${id}`);
}
