import {requestClient} from "#/api/request";


export async function getPermissionByCondition(params) {
  return requestClient.get('/ryu-user/permissions/page', {params});
}

export async function addPermission(data) {
  return requestClient.post('/ryu-user/permissions/add', data);
}

export async function updatePermission(data) {
  return requestClient.put('/ryu-user/permissions/edit', data);
}

export async function deletePermission(id) {
  return requestClient.delete(`/ryu-user/permissions/delete/${id}`);
}
