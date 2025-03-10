import {requestClient} from "#/api/request";


export async function getDictTypePage(params: any) {
  return requestClient.get('/ryu-user/sysDictType/page', {params});
}

export async function getAllDictType() {
  return requestClient.get('/ryu-user/sysDictType/list');
}


export async function addDictType(data) {
  return requestClient.post('/ryu-user/sysDictType/add', data);
}

export async function updateDictType(data) {
  return requestClient.put('/ryu-user/sysDictType/edit', data);
}


export async function deleteDictType(id) {
  return requestClient.delete(`/ryu-user/sysDictType/delete/${id}`);
}

export async function batchDeleteDictType(data) {
  return requestClient.post(`/ryu-user/sysDictType/delete/batch`,data);
}
