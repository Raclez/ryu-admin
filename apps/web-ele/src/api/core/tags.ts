import {requestClient} from "#/api/request";

export async function getAllTags() {
  return requestClient.get('/ryu-content/tags/list');
}
export async function getTagsPage(params) {
  return requestClient.get('/ryu-content/tags/page', {params});
}

export async function saveTags(data) {
  return requestClient.post('/ryu-content/tags/save', data);
}
export async function deleteTags(id: string|number) {
  return requestClient.delete(`/ryu-content/tags/delete/${id}`);
}

export async function updateTags(data) {
  return requestClient.put('/ryu-content/tags/edit');
}
