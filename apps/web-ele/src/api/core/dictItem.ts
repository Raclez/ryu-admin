import {requestClient} from "#/api/request";

export async function  getDictItemList  (params: DictItemParams) {
 return  requestClient.get('/ryu-user/sysDictItem/getDictItems', {params})
}
export async function  addDictItem  (data: any) {
  return requestClient.post('/ryu-user/sysDictItem/save', data)
}
export async function updateDictItem (data: any) {
  return requestClient.put('/ryu-user/sysDictItem/edit', data)
}
export async function deleteDictItem  (id: string) {
  return requestClient.delete(`/ryu-user/sysDictItem/delete/${id}`)
}

export async function getDictItemsByContidion(params: String) {
  return requestClient.get('/ryu-user/sysDictItem/condition', {params})
}
