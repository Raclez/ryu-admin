import {requestClient} from "#/api/request";

export async function getRolesByPage(params) {
  return requestClient.get('/ryu-user/roles/page', {params});
}

export async function addRole(data) {
  return requestClient.post('/ryu-user/roles/save', data);
}

export async function updateRole(data) {
  return requestClient.put('/ryu-user/roles/edit', data);
}

export async function deleteRole(id) {
  return requestClient.delete(`/ryu-user/roles/delete/${id}`);
}
