import {requestClient} from "#/api/request";

export async function  getDictItemList  (params: DictItemParams) {
 return  requestClient.get('/ryu-user/sysDictItem/getDictItems', {params})
}
export async function  addDictItem  (data: any) {
 return  requestClient.post('/ryu-user/system/sysDictItem/add', data)
}
export async function updateDictItem (data: any) {
 return requestClient.put('/ryu-user/system/sysDictItem/edit', data)
}
export async function deleteDictItem  (id: string) {
  return  requestClient.delete(`/ryu-user/system/sysDictItem/delete/${id}`)
}
