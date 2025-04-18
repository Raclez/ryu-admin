<script setup>
import {computed, onMounted, reactive, ref, watch} from 'vue';

import {JsonViewer} from '@vben/common-ui';

import {
  Delete,
  Download,
  Edit,
  Filter,
  InfoFilled,
  Plus,
  Refresh,
  Search,
  Warning,
} from '@element-plus/icons-vue';
import {useWindowSize} from '@vueuse/core';
import {ElMessage, ElMessageBox} from 'element-plus';

import {getDictItemsByCondition} from '#/api/core/dictItem.js';
import {useConfigStore} from '#/store/sysConfig.js';

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);

// 控制筛选框显示状态
const showFilter = ref(true);

// 切换筛选框显示/隐藏
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  localStorage.setItem('configFilterVisible', showFilter.value.toString());
};

// 状态和数据
const configStore = useConfigStore();
const multipleTableRef = ref(null);
const configFormRef = ref(null);
const dialogVisible = ref(false);
const dialogType = ref('add');
const selectedConfigs = ref([]);
const configGroup = ref('');
const configStatus = ref('');
const submitting = ref(false);
const loading = ref(false);
const groupOptions = ref([]);

// 表单校验规则
const configRules = {
  configKey: [
    {required: true, message: '请输入配置键', trigger: 'blur'},
    {max: 100, message: '配置键长度不能超过100个字符', trigger: 'blur'},
  ],
  configValue: [{required: true, message: '请输入配置值', trigger: 'blur'}],
};

// 扩展信息相关
const extraFields = ref([{key: '', value: ''}]);
const extraJsonString = ref('{}');
const extraJsonError = ref(false);

// 添加扩展字段
const addExtraField = () => {
  extraFields.value.push({key: '', value: ''});
};

// 移除扩展字段
const removeExtraField = (index) => {
  extraFields.value.splice(index, 1);
  if (extraFields.value.length === 0) {
    addExtraField();
  }
  updateExtraValue();
};

// 处理JSON输入
const handleExtraJsonInput = (val) => {
  try {
    JSON.parse(val || '{}');
    extraJsonError.value = false;
    // 同步到结构化编辑
    const jsonObj = JSON.parse(val || '{}');
    extraFields.value = Object.entries(jsonObj).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));
    if (extraFields.value.length === 0) {
      addExtraField();
    }
    // 更新配置
    currentConfig.extra = val;
  } catch {
    extraJsonError.value = true;
  }
};

// 更新扩展信息值
const updateExtraValue = () => {
  const extraObject = {};
  extraFields.value.forEach((field) => {
    if (field.key.trim()) {
      extraObject[field.key] = field.value;
    }
  });
  extraJsonString.value = JSON.stringify(extraObject, null, 2);
  currentConfig.extra = extraJsonString.value;
};

// 监听结构化编辑变化
watch(
  () => [...extraFields.value],
  () => {
    updateExtraValue();
  },
  {deep: true},
);

// 当前编辑的配置 - 移除版本字段
const currentConfig = reactive({
  id: '',
  configKey: '',
  configValue: '',
  dictId: '',
  status: 1,
  remark: '',
  extra: '{}',
});

// 监视配置分组变化
watch(configGroup, (newVal) => {
  configStore.pagination.dictId = newVal;
});

// 修改 fetchConfigGroups 函数，确保能正确获取分组数据
const fetchConfigGroups = async () => {
  try {
    loading.value = true;
    const params = {
      key: 'CONFIG_GROUP',
    };
    groupOptions.value = await getDictItemsByCondition(params);
  } catch (error) {
    console.error('获取配置分组失败:', error);
    ElMessage.error('获取配置分组失败');
  } finally {
    loading.value = false;
  }
};

// 获取分组名称
const getDictGroupName = (dictId) => {
  if (!dictId) return '';
  const group = groupOptions.value.find((item) => item.id === dictId);
  return group ? group.dictItemValue : '';
};

// 获取分组标签类型
const getGroupTagType = (group) => {
  if (!group) return 'info';

  const types = ['', 'success', 'warning', 'danger', 'info'];
  // 基于分组名称生成一个稳定的索引
  const hash = group
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return types[hash % types.length];
};

// 判断是否为 JSON 值
const isJsonValue = (value) => {
  if (!value) return false;
  try {
    return (
      typeof value === 'string' &&
      ((value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']')))
    );
  } catch {
    return false;
  }
};

// 获取JSON数据，用于JsonViewer
const getExtraJsonData = (jsonStr) => {
  try {
    if (!jsonStr || jsonStr === '{}') return {};
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('解析JSON失败:', error);
    return {error: '无效的JSON数据'};
  }
};

// 检查是否有扩展数据
const hasExtraData = (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr || '{}');
    return Object.keys(data).length > 0;
  } catch {
    return false;
  }
};

// 切换行展开状态
const toggleRowExpand = (index, row) => {
  // 设置展开状态
  row.isExpanded = !row.isExpanded;
  // 通过表格ref控制行的展开/折叠
  if (multipleTableRef.value) {
    if (row.isExpanded) {
      multipleTableRef.value.toggleRowExpansion(row, true);
    } else {
      multipleTableRef.value.toggleRowExpansion(row, false);
    }
  }
};

// 格式化 JSON
const formatJson = (jsonString) => {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, 2);
  } catch {
    return jsonString;
  }
};

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '未知';
  const date = new Date(dateTime);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// 处理页码变更
const handleCurrentChange = async (val) => {
  configStore.pagination.current = val;
  loading.value = true;
  try {
    await configStore.fetchConfigs();
  } finally {
    loading.value = false;
  }
};

// 处理每页条数变更
const handleSizeChange = async (val) => {
  configStore.pagination.pageSize = val;
  loading.value = true;
  try {
    await configStore.fetchConfigs();
  } finally {
    loading.value = false;
  }
};

// 处理表格选择变更
const handleSelectionChange = (val) => {
  selectedConfigs.value = val;
};

// 初始化每行数据，添加展开状态属性
const initRowData = () => {
  if (configStore.configList && configStore.configList.length > 0) {
    configStore.configList.forEach((row) => {
      if (row.isExpanded === undefined) {
        row.isExpanded = false;
      }
    });
  }
};

// 监听配置列表变化，初始化行数据
watch(
  () => configStore.configList,
  () => {
    initRowData();
  },
  {immediate: true, deep: true},
);

// 添加配置 - 更新以移除版本
const addConfig = () => {
  dialogType.value = 'add';
  Object.keys(currentConfig).forEach((key) => {
    currentConfig[key] = key === 'status' ? 1 : '';
  });
  currentConfig.extra = '{}';
  initExtraEditor();
  dialogVisible.value = true;
};

// 编辑配置 - 添加扩展信息处理
const editConfig = (row) => {
  dialogType.value = 'edit';
  Object.keys(currentConfig).forEach((key) => {
    currentConfig[key] = row[key];
  });
  initExtraEditor();
  dialogVisible.value = true;
};

// 初始化扩展信息编辑器
const initExtraEditor = () => {
  try {
    let extraObj = {};
    if (currentConfig.extra && typeof currentConfig.extra === 'string') {
      extraObj = JSON.parse(currentConfig.extra || '{}');
    }
    extraFields.value = Object.entries(extraObj).map(([key, value]) => ({
      key,
      value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }));

    if (extraFields.value.length === 0) {
      extraFields.value = [{key: '', value: ''}];
    }

    extraJsonString.value = JSON.stringify(extraObj, null, 2);
    extraJsonError.value = false;
  } catch {
    extraFields.value = [{key: '', value: ''}];
    extraJsonString.value = '{}';
    extraJsonError.value = false;
  }
};

// 提交表单 - 移除版本号处理
const submitForm = async () => {
  if (!configFormRef.value) return;

  await configFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      if (extraJsonError.value) {
        ElMessage.error('扩展信息JSON格式错误，请检查');
        return;
      }

      submitting.value = true;
      try {
        if (dialogType.value === 'add') {
          await configStore.createConfig(currentConfig);
          ElMessage.success('添加成功');
        } else {
          await configStore.editConfig(currentConfig);
          ElMessage.success('更新成功');
        }
        dialogVisible.value = false;
        await configStore.fetchConfigs();
      } catch (error) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        submitting.value = false;
      }
    }
  });
};

// 处理删除
const handleDelete = async (row) => {
  try {
    loading.value = true;
    await configStore.removeConfig(row.id);
    ElMessage.success('删除成功');
    await configStore.fetchConfigs();
  } catch (error) {
    ElMessage.error(error.message || '删除失败');
  } finally {
    loading.value = false;
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedConfigs.value.length === 0) {
    ElMessage.warning('请至少选择一条记录');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedConfigs.value.length} 条记录吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    );

    loading.value = true;
    const ids = selectedConfigs.value.map((item) => item.id);
    await configStore.batchDeleteConfigs(ids);
    ElMessage.success('批量删除成功');
    await configStore.fetchConfigs();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 修改导出数据方法
const exportData = () => {
  const headers = [
    '配置键',
    '配置值',
    '配置分组',
    '状态',
    '备注',
    '扩展信息',
    '创建时间',
    '更新时间',
  ];

  const data = configStore.configList.map((item) => [
    item.configKey,
    item.configValue,
    getDictGroupName(item.dictId) || '未分组',
    item.status === 1 ? '启用' : '禁用',
    item.remark || '',
    item.extra || '',
    formatDateTime(item.createTime),
    formatDateTime(item.updateTime),
  ]);

  // 创建CSV内容
  let csvContent = `${headers.join(',')}\n`;
  data.forEach((row) => {
    csvContent += `${row
      .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
      .join(',')}\n`;
  });

  // 创建Blob对象
  const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);

  // 创建下载链接
  const link = document.createElement('a');
  link.href = url;
  link.download = `系统配置_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  // 释放URL
  URL.revokeObjectURL(url);

  ElMessage.success('导出成功');
};

// 重置筛选条件
const reset = () => {
  configStore.pagination.configKey = '';
  configGroup.value = '';
  configStatus.value = '';
  configStore.pagination.dictId = '';
  configStore.pagination.current = 1;
  configStore.fetchConfigs();
};

// 监听屏幕尺寸变化，自动在移动设备上隐藏筛选栏
watch(isMobile, (newValue) => {
  if (newValue && showFilter.value) {
    showFilter.value = false;
  }
});

// 初始化
onMounted(async () => {
  // 从localStorage中恢复筛选框显示状态
  const savedFilterState = localStorage.getItem('configFilterVisible');
  if (savedFilterState === null) {
    // 默认在移动设备上隐藏筛选栏
    showFilter.value = !isMobile.value;
  } else {
    showFilter.value = savedFilterState === 'true';
  }

  loading.value = true;
  try {
    // 先获取分组选项
    await fetchConfigGroups();
    // 再获取配置列表
    await configStore.fetchConfigs();
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <div class="system-config-list">
    <el-card v-show="showFilter" class="filter-card mb-4">
      <el-form :inline="true" class="filter-container">
        <el-form-item class="form-item">
          <el-input
            v-model="configStore.pagination.configKey"
            clearable
            placeholder="请输入系统配置名"
            prefix-icon="Search"
            size="large"
          />
        </el-form-item>

        <el-form-item class="form-item">
          <el-select
            v-model="configGroup"
            class="group-select"
            clearable
            placeholder="配置分组"
            popper-class="group-select-dropdown"
            size="large"
          >
            <el-option label="全部分组" value=""/>
            <template v-if="groupOptions.length > 0">
              <el-option
                v-for="group in groupOptions"
                :key="group.id"
                :label="group.dictItemValue"
                :value="group.id"
              >
                <div class="dict-group-option">
                  <el-tag
                    :type="group.status === 1 ? 'success' : 'danger'"
                    class="group-tag"
                    size="small"
                  >
                    {{ group.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                  <span class="group-name">{{ group.dictItemValue }}</span>
                </div>
              </el-option>
            </template>
            <template v-else>
              <el-empty :image-size="60" description="暂无分组数据"/>
            </template>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button
              :icon="Search"
              :loading="loading"
              type="primary"
              @click="configStore.fetchConfigs()"
            >
              查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="reset">
              重置
            </el-button>
            <el-button
              :disabled="loading"
              :icon="Plus"
              type="success"
              @click="addConfig"
            >
              添加配置
            </el-button>
            <el-button
              v-show="selectedConfigs.length > 0"
              :disabled="loading"
              :icon="Delete"
              :loading="loading"
              type="danger"
              @click="handleBatchDelete"
            >
              批量删除 {{ selectedConfigs.length }} 项
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card
      v-loading="loading"
      class="table-card"
      element-loading-background="rgba(0, 0, 0, 0.1)"
      element-loading-text="加载中..."
    >
      <div class="table-header">
        <div class="table-title">系统配置列表</div>
        <div class="table-actions">
          <el-tooltip content="过滤搜索" placement="top">
            <el-button
              :icon="Filter"
              circle
              text
              type="primary"
              @click="toggleFilter"
            />
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button
              :icon="Refresh"
              :loading="loading"
              circle
              text
              type="primary"
              @click="configStore.fetchConfigs()"
            />
          </el-tooltip>
          <el-tooltip content="导出数据" placement="top">
            <el-button
              :icon="Download"
              circle
              text
              type="primary"
              @click="exportData"
            />
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="multipleTableRef"
        :data="configStore.configList"
        :max-height="500"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          :reserve-selection="true"
          type="selection"
          width="50"
        />
        <el-table-column type="expand" width="50">
          <template #default="{ row }">
            <div class="expanded-content">
              <div class="json-viewer-container">
                <div class="json-title">
                  <el-icon>
                    <InfoFilled/>
                  </el-icon>
                  <span>扩展信息</span>
                </div>
                <div v-if="hasExtraData(row.extra)" class="json-content">
                  <JsonViewer
                    :expand-depth="2"
                    :value="getExtraJsonData(row.extra)"
                    boxed
                    copyable
                  />
                </div>
                <el-empty v-else :image-size="60" description="暂无扩展信息"/>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="配置键"
          min-width="120"
          prop="configKey"
          show-overflow-tooltip
        >
          <template #default="scope">
            <el-tooltip :content="scope.row.configKey" placement="top">
              <span class="config-key">{{ scope.row.configKey }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column
          align="center"
          label="配置值"
          min-width="120"
          prop="configValue"
          show-overflow-tooltip
        />
        <el-table-column
          :visible="!isMobile"
          align="center"
          label="配置分组"
          min-width="100"
          prop="configGroup"
        >
          <template #default="scope">
            <el-tag
              :type="getGroupTagType(getDictGroupName(scope.row.dictId))"
              size="small"
            >
              {{ getDictGroupName(scope.row.dictId) || '未分组' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.status === 1 ? 'success' : 'danger'"
              effect="dark"
              round
            >
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          :visible="!isMobile"
          align="center"
          label="配置备注"
          min-width="120"
          prop="remark"
          show-overflow-tooltip
        />

        <el-table-column
          align="center"
          fixed="right"
          label="扩展信息"
          width="160"
        >
          <template #default="scope">
            <el-button
              class="expand-button"
              link
              size="small"
              type="primary"
              @click="toggleRowExpand(scope.$index, scope.row)"
            >
              {{ scope.row.isExpanded ? '收起扩展信息' : '查看扩展信息' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          :visible="!isMobile"
          align="center"
          label="创建时间"
          min-width="180"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column
          :visible="!isMobile"
          align="center"
          label="修改时间"
          min-width="180"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑" placement="top">
                <el-button
                  :disabled="loading"
                  :icon="Edit"
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="editConfig(scope.row)"
                />
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该配置吗？"
                @confirm="handleDelete(scope.row)"
              >
                <template #reference>
                  <el-button
                    :disabled="loading"
                    :icon="Delete"
                    circle
                    class="action-button delete-button"
                    size="small"
                    type="danger"
                  />
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div
        v-if="configStore.configList.length === 0 && !loading"
        class="empty-data"
      >
        <el-empty description="暂无数据"/>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="configStore.pagination.current"
          v-model:page-size="configStore.pagination.pageSize"
          :background="true"
          :page-sizes="[10, 20, 30, 50]"
          :total="configStore.pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :title="dialogType === 'add' ? '新增系统配置' : '编辑系统配置'"
      class="custom-dialog"
      destroy-on-close
      width="740px"
    >
      <el-form
        ref="configFormRef"
        :model="currentConfig"
        :rules="configRules"
        class="optimized-form"
        label-width="100px"
      >
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-row :gutter="24">
            <!-- 配置键 -->
            <el-col :span="24">
              <el-form-item label="配置键" prop="configKey" required>
                <el-input
                  v-model="currentConfig.configKey"
                  :disabled="dialogType === 'edit'"
                  :maxlength="100"
                  class="full-width-input"
                  clearable
                  placeholder="请输入配置键"
                  show-word-limit
                />
              </el-form-item>
            </el-col>

            <!-- 配置值 -->
            <el-col :span="24">
              <el-form-item label="配置值" prop="configValue" required>
                <el-input
                  v-model="currentConfig.configValue"
                  :maxlength="500"
                  :rows="isJsonValue(currentConfig.configValue) ? 5 : 3"
                  :type="
                    isJsonValue(currentConfig.configValue) ? 'textarea' : 'text'
                  "
                  class="full-width-input"
                  placeholder="请输入配置值"
                  show-word-limit
                />
                <div
                  v-if="isJsonValue(currentConfig.configValue)"
                  class="input-tip"
                >
                  <el-icon>
                    <Warning/>
                  </el-icon>
                  检测到JSON格式内容，已切换到多行文本框
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">分类与状态</div>
          <el-row :gutter="24">
            <!-- 配置分组 -->
            <el-col :span="12">
              <el-form-item label="配置分组" prop="dictId">
                <el-select
                  v-model="currentConfig.dictId"
                  allow-create
                  class="full-width-input"
                  default-first-option
                  filterable
                  placeholder="请选择分组"
                  popper-class="group-select-dropdown"
                >
                  <el-option
                    v-for="group in groupOptions"
                    :key="group.id"
                    :label="group.dictItemValue"
                    :value="group.id"
                  >
                    <div class="dict-group-option">
                      <el-tag
                        :type="group.status === 1 ? 'success' : 'danger'"
                        class="group-tag"
                        size="small"
                      >
                        {{ group.status === 1 ? '启用' : '禁用' }}
                      </el-tag>
                      <span class="group-name">{{ group.dictItemValue }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <!-- 状态 -->
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-radio-group
                  v-model="currentConfig.status"
                  class="status-radio-group"
                >
                  <el-radio :label="1">
                    <el-tag effect="plain" type="success">启用</el-tag>
                  </el-radio>
                  <el-radio :label="0">
                    <el-tag effect="plain" type="danger">禁用</el-tag>
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <div class="section-title">高级设置</div>
          <el-row :gutter="24">
            <!-- 扩展信息 -->
            <el-col :span="24">
              <el-form-item label="扩展信息" prop="extra">
                <el-tabs class="extra-tabs" type="border-card">
                  <el-tab-pane label="结构化编辑">
                    <div class="extra-structured-editor">
                      <div
                        v-for="(field, index) in extraFields"
                        :key="index"
                        class="extra-field-row"
                      >
                        <el-input
                          v-model="field.key"
                          class="extra-key-input"
                          placeholder="键名"
                        />
                        <el-input
                          v-model="field.value"
                          class="extra-value-input"
                          placeholder="键值"
                        />
                        <el-button
                          :icon="Delete"
                          circle
                          size="small"
                          type="danger"
                          @click="removeExtraField(index)"
                        />
                      </div>
                      <div class="extra-actions">
                        <el-button
                          :icon="Plus"
                          size="small"
                          type="primary"
                          @click="addExtraField"
                        >
                          添加字段
                        </el-button>
                      </div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="JSON编辑">
                    <el-input
                      v-model="extraJsonString"
                      :class="{ 'json-error': extraJsonError }"
                      :rows="5"
                      class="full-width-input"
                      placeholder="请输入JSON格式的扩展信息"
                      type="textarea"
                      @input="handleExtraJsonInput"
                    />
                    <div v-if="extraJsonError" class="input-tip">
                      <el-icon>
                        <Warning/>
                      </el-icon>
                      JSON格式错误，请检查输入内容
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </el-form-item>
            </el-col>

            <!-- 备注 -->
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="currentConfig.remark"
                  :maxlength="200"
                  :rows="3"
                  class="full-width-input"
                  placeholder="请输入备注信息（选填）"
                  resize="none"
                  show-word-limit
                  type="textarea"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            :disabled="submitting"
            class="cancel-button"
            @click="dialogVisible = false"
          >
            取消
          </el-button>
          <el-button
            :loading="submitting"
            class="submit-button"
            type="primary"
            @click="submitForm"
          >
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<style scoped>
.system-config-list {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.filter-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 15px;
}

.form-item {
  margin-bottom: 0;
  margin-right: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.table-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 400px;
  position: relative;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 0 5px;
}

.table-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.table-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 15px 0;
}

.responsive-table {
  width: 100%;
  overflow-x: auto;
}

.action-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.action-button {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: scale(1);
  transition: all 0.2s ease-in-out;
}

.action-button:hover {
  transform: scale(1.1);
}

.edit-button {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.delete-button {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 20px 30px;
}

.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.config-key {
  font-weight: 500;
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .system-config-list {
    padding: 10px;
  }

  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }

  .form-item {
    width: 100%;
  }

  .el-input,
  .el-select,
  .el-date-editor {
    width: 100%;
  }

  .action-buttons {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-container {
    padding: 10px 0;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-actions {
    align-self: flex-end;
  }

  .custom-dialog {
    width: 90% !important;
  }

  .el-col {
    width: 100%;
  }
}

/* 表格行hover效果 */
:deep(.el-table__row) {
  transition: all 0.3s;
}

:deep(.el-table__row:hover) {
  background-color: var(--el-color-primary-light-9) !important;
  transform: translateY(-2px);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 表头样式 */
:deep(.el-table__header) {
  font-weight: bold;
  background-color: var(--el-color-info-light-9);
}

:deep(.el-table__header th) {
  background-color: var(--el-color-info-light-9);
  color: var(--el-text-color-primary);
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-card__body) {
  padding: 15px 20px;
}

:deep(.el-backtop) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  background-color: var(--el-color-primary);
  color: #fff;
}

/* 表单样式优化 */
.optimized-form {
  max-width: 100%;
}

.form-item-compact {
  margin-bottom: 22px;
}

.full-width-input {
  width: 100%;
}

.status-switch {
  width: 100%;
  display: flex;
  align-items: center;
  height: 32px;
}

.dict-group-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-button,
.submit-button {
  min-width: 100px;
  padding: 12px 20px;
  font-size: 14px;
  border-radius: 4px;
}

.submit-button {
  font-weight: 500;
}

.custom-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 30px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-info-light-9);
}

.custom-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.custom-dialog :deep(.el-dialog__body) {
  padding: 30px;
}

.custom-dialog :deep(.el-dialog__footer) {
  padding: 20px 30px;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-color-info-light-9);
}

/* 表格列样式 */
.config-key {
  font-weight: 500;
  color: var(--el-color-primary);
}

/* 分组选择框样式 */
.group-select {
  width: 220px;
}

.group-tag {
  margin-right: 8px;
}

.group-name {
  font-weight: 500;
}

:deep(.group-select-dropdown .el-select-dropdown__item) {
  height: auto;
  line-height: 1.5;
  padding: 8px 12px;
}

/* 表单分区样式 */
.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.form-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
}

/* 输入提示样式 */
.input-tip {
  margin-top: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
}

.input-tip .el-icon {
  font-size: 14px;
  color: var(--el-color-warning);
}

/* 状态单选按钮组 */
.status-radio-group {
  width: 100%;
  display: flex;
  justify-content: space-around;
}

:deep(.status-radio-group .el-radio) {
  margin-right: 0;
}

:deep(.status-radio-group .el-radio .el-radio__label) {
  padding-left: 8px;
}

/* 扩展信息编辑器样式 */
.extra-tabs {
  border: none;
  box-shadow: none;
}

.extra-tabs :deep(.el-tabs__header) {
  margin-bottom: 15px;
}

.extra-structured-editor {
  padding: 10px;
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
  max-height: 300px;
  overflow-y: auto;
}

.extra-field-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px;
}

.extra-key-input {
  width: 35%;
}

.extra-value-input {
  flex: 1;
}

.extra-actions {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}

.json-error {
  border-color: var(--el-color-danger);
}

/* JSON查看器相关样式 */
.expanded-content {
  padding: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  margin: 10px;
}

.json-viewer-container {
  width: 100%;
}

.json-title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--el-color-primary);
  gap: 8px;
}

.json-content {
  padding: 15px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.expand-button {
  font-size: 14px;
}

.expand-button:hover {
  text-decoration: underline;
}
</style>
