import {defineStore} from 'pinia';
import {ref} from 'vue';
import {
  getSystemConfigByPage,
  addSystemConfig,
  updateSystemConfig,
  deleteSystemConfig
} from '#/api/core/systemConfig';

interface SystemConfig {
  id: string;
  // 根据你的实际配置项补充类型
  configKey: string;
  configValue: string;
  remark?: string;
  // ...其他字段
}

export const useConfigStore = defineStore('systemConfig', () => {
  // 状态
  const configList = ref<SystemConfig[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    current: 1,
    pageSize: 10,
    total: 0,
    configKey: ''
  });

  // 操作
  const fetchConfigs = async () => {
    try {
      loading.value = true;
      const response = await getSystemConfigByPage({
        currentPage: pagination.value.current,
        pageSize: pagination.value.pageSize,
        configKey: pagination.value.configKey
      });

      configList.value = response.records;
      pagination.value.total = response.total;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取配置失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createConfig = async (configData: Omit<SystemConfig, 'id'>) => {
    try {
      configData.id = undefined
      await addSystemConfig(configData);
      await fetchConfigs(); // 创建后刷新列表
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建配置失败';
      throw err;
    }
  };

  const editConfig = async (configData: SystemConfig) => {
    try {
      await updateSystemConfig(configData);
      await fetchConfigs(); // 更新后刷新列表
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新配置失败';
      throw err;
    }
  };

  const removeConfig = async (id: string) => {
    try {
      await deleteSystemConfig(id);
      // 如果删除的是当前页最后一项，回到前一页
      if (configList.value.length === 1 && pagination.value.current > 1) {
        pagination.value.current--;
      }
      await fetchConfigs();
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除配置失败';
      throw err;
    }
  };

  // 分页变化处理
  const handlePaginationChange = (page: number, pageSize: number) => {
    pagination.value.current = page;
    pagination.value.pageSize = pageSize;
    fetchConfigs();
  };

  return {
    configList,
    loading,
    error,
    pagination,
    fetchConfigs,
    createConfig,
    editConfig,
    removeConfig,
    handlePaginationChange
  };
});
