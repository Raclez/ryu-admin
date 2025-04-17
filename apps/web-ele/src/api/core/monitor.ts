import {requestClient} from "#/api/request";

export async function getSystemInfo() {
  return requestClient.get('/ryu-user/monitor/info');
}

export async function getAllThreads() {
  return requestClient.get('/ryu-user/monitor/threads');
}

export async function getThreadStats() {
  return requestClient.get('/ryu-user/monitor/thread-stats');
}
