import {requestClient} from "#/api/request";

export async function getFilesGroup(params : any) {
  return requestClient.get('/ryu-files/files/group', { params });
}
