<template>
  <div class="permission-list">
    <el-card v-show="showFilter" :class="{ 'filter-card-slide': showFilter }"
             class="filter-card mb-4">
      <el-form :inline="true" :model="searchForm" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="searchForm.name" clearable placeholder="请输入权限名称"
                    prefix-icon="Search"
                    size="large"></el-input>
        </el-form-item>
        <el-form-item class="form-item">
          <el-input v-model="searchForm.identity" clearable placeholder="请输入权限标识"
                    prefix-icon="Key"
                    size="large"></el-input>
        </el-form-item>
        <el-form-item class="form-item">
          <el-select v-model="searchForm.module" class="full-width-input" clearable
                     placeholder="请选择模块">
            <el-option v-for="item in moduleOptions" :key="item" :label="item"
                       :value="item"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item class="form-item">
          <el-select v-model="searchForm.isActive" class="full-width-input" clearable
                     placeholder="状态">
            <el-option :label="'启用'" :value="1"></el-option>
            <el-option :label="'禁用'" :value="0"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="loading" type="primary" @click="handleSearch">查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="resetSearch">重置</el-button>
            <el-button :disabled="loading" :icon="Plus" type="success" @click="handleAddPermission">
              新增权限
            </el-button>
            <div v-show="selectedPermissions.length" class="batch-actions">
              <el-button :disabled="loading" :icon="Delete" type="danger"
                         @click="handleBatchDelete">批量删除
              </el-button>
              <el-dropdown>
                <el-button>
                  批量操作
                  <el-icon class="el-icon--right">
                    <arrow-down/>
                  </el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleBatchStatus(1)">批量启用</el-dropdown-item>
                    <el-dropdown-item @click="handleBatchStatus(0)">批量禁用</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="table-card" element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">权限列表</div>
        <div class="table-actions">
          <el-tooltip content="展开/收起筛选条件" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="高级搜索" placement="top">
            <el-button :icon="Search" circle text type="primary"
                       @click="showFilter = true"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="loading" circle text
                       type="primary" @click="getPermissionList()"></el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="permissionList"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column :reserve-selection="true" align="center" type="selection" width="55"/>
        <el-table-column align="center" label="权限名称" min-width="120" prop="name">
          <template #default="scope">
            <span class="permission-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="权限标识" min-width="150" prop="identity"
                         show-overflow-tooltip>
          <template #default="scope">
            <el-tag size="small" type="primary">{{ scope.row.identity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="所属模块" min-width="120" prop="module">
          <template #default="scope">
            <el-tag size="small" type="success">{{ scope.row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" min-width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.isActive"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column align="center" label="权限描述" min-width="180" prop="description"
                         show-overflow-tooltip/>
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="创建时间"
                         min-width="160" prop="createTime"/>
        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑权限" placement="top">
                <el-button
                  :disabled="loading"
                  :icon="Edit"
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="handleEdit(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该权限吗？"
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
                  ></el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :background="true"
          :page-sizes="[10, 20, 30, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑权限对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增权限' : '编辑权限'"
      class="custom-dialog"
      destroy-on-close
      width="600px"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        class="optimized-form"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" class="full-width-input"
                    placeholder="请输入权限名称"></el-input>
        </el-form-item>
        <el-form-item label="权限标识" prop="identity">
          <el-input v-model="permissionForm.identity" class="full-width-input"
                    placeholder="请输入权限标识"></el-input>
        </el-form-item>
        <el-form-item label="所属模块" prop="module">
          <el-select v-model="permissionForm.module" class="full-width-input"
                     placeholder="请选择模块">
            <el-option v-for="item in moduleOptions" :key="item" :label="item"
                       :value="item"></el-option>
            <el-option label="+ 添加新模块" value="add_new"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="permissionForm.module === 'add_new'" label="新模块名称"
                      prop="newModule">
          <el-input v-model="permissionForm.newModule" class="full-width-input"
                    placeholder="请输入新模块名称"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="isActive">
          <el-switch
            v-model="permissionForm.isActive"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          ></el-switch>
        </el-form-item>
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            :rows="3"
            class="full-width-input"
            placeholder="请输入权限描述"
            type="textarea"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-button" @click="dialogVisible = false">取消</el-button>
          <el-button class="submit-button" type="primary" @click="handleSubmitPermission">确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {
  deletePermission,
  getPermissionByCondition,
  addPermission,
  updatePermission,
  batchDeletePermission,
  batchUpdatePermissionStatus,
  getSystemModules
} from "#/api/core/permission";
import {Search, Refresh, Plus, Edit, Delete, Filter, Key, ArrowDown} from "@element-plus/icons-vue";
import {useWindowSize} from '@vueuse/core';

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);

// 筛选条件显示状态
const showFilter = ref(true);
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  // 保存筛选器状态到localStorage
  try {
    localStorage.setItem('permission_filter_status', JSON.stringify(showFilter.value));
  } catch (error) {
    console.error('保存筛选器状态出错:', error);
  }
};

// 获取过滤器状态
const getStoredFilterStatus = () => {
  try {
    const status = localStorage.getItem('permission_filter_status');
    if (status !== null) {
      showFilter.value = JSON.parse(status);
    }
  } catch (error) {
    console.error('获取存储的筛选器状态出错:', error);
  }
};

// 权限列表数据
const permissionList = ref([]);
const loading = ref(false);

// 模块选项
const moduleOptions = ref([]);

// 搜索表单
const searchForm = reactive({
  name: '',
  identity: '',
  module: '',
  isActive: ''
});

// 分页数据
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});

// 权限表单
const dialogVisible = ref(false);
const dialogType = ref('add'); // 'add' 或 'edit'
const permissionFormRef = ref(null);
const permissionForm = reactive({
  id: '',
  name: '',
  identity: '',
  module: '',
  newModule: '',
  isActive: 1,
  description: ''
});
// 选中的权限
const selectedPermissions = ref([]);

// 处理表格多选
const handleSelectionChange = (selection) => {
  selectedPermissions.value = selection;
};

// 获取模块列表
const fetchModules = async () => {
  try {
    moduleOptions.value = await getSystemModules();
  } catch (error) {
    console.error('获取模块列表出错:', error);
  }
}

// 批量删除
const handleBatchDelete = () => {
  if (!selectedPermissions.value.length) return;

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedPermissions.value.length} 个权限吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      const ids = selectedPermissions.value.map(item => item.id);
      await batchDeletePermission(ids);
      ElMessage.success('批量删除成功');
      selectedPermissions.value = [];
      await getPermissionList();
    } catch (error) {
      console.error('批量删除失败', error);
      ElMessage.error('批量删除失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
  });
};

// 批量更新状态
const handleBatchStatus = async (status) => {
  if (!selectedPermissions.value.length) return;

  const statusText = status === 1 ? '启用' : '禁用';

  ElMessageBox.confirm(
    `确定要批量${statusText}选中的 ${selectedPermissions.value.length} 个权限吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      const ids = selectedPermissions.value.map(item => item.id);
      await batchUpdatePermissionStatus(ids, status);
      ElMessage.success(`批量${statusText}成功`);

      // 更新当前列表数据状态
      selectedPermissions.value.forEach(item => {
        const listItem = permissionList.value.find(p => p.id === item.id);
        if (listItem) {
          listItem.isActive = status;
        }
      });

      selectedPermissions.value = [];
    } catch (error) {
      console.error(`批量${statusText}失败`, error);
      ElMessage.error(`批量${statusText}失败`);
    } finally {
      loading.value = false;
    }
  }).catch(() => {
  });
};

// 处理权限状态修改
const handleStatusChange = async (row) => {
  try {
    loading.value = true;
    await updatePermission({
      id: row.id,
      name: row.name,
      identity: row.identity,
      module: row.module,
      isActive: row.isActive,
      description: row.description
    });
    ElMessage.success('状态修改成功');
  } catch (error) {
    console.error('状态修改失败', error);
    ElMessage.error('状态修改失败');
    // 回滚状态
    row.isActive = row.isActive === 1 ? 0 : 1;
  } finally {
    loading.value = false;
  }
};

// 表单验证规则
const permissionRules = reactive({
  name: [
    {required: true, message: '请输入权限名称', trigger: 'blur'},
    {min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur'}
  ],
  identity: [
    {required: true, message: '请输入权限标识', trigger: 'blur'},
    {
      pattern: /^[a-z0-9_]+(\:[a-z0-9_]+)*$/,
      message: '格式不正确，请使用小写字母、数字、下划线，可用冒号分隔',
      trigger: 'blur'
    }
  ],
  module: [
    {required: true, message: '请选择所属模块', trigger: 'change'}
  ],
  newModule: [
    {
      required: true,
      message: '请输入新模块名称',
      trigger: 'blur',
      validator: (rule, value, callback) => {
        if (permissionForm.module === 'add_new' && !value) {
          callback(new Error('请输入新模块名称'));
        } else {
          callback();
        }
      }
    }
  ],
  description: [
    {max: 200, message: '最多输入200个字符', trigger: 'blur'}
  ]
});

const getPermissionList = async () => {
  loading.value = true;
  try {
    const params = {
      currentPage: pagination.currentPage,
      pageSize: pagination.pageSize,
      name: searchForm.name,
      identity: searchForm.identity,
      module: searchForm.module,
      isActive: searchForm.isActive
    };
    const res = await getPermissionByCondition(params);
    permissionList.value = res.records;
    pagination.total = res.total;
    pagination.currentPage = res.current;
    pagination.pageSize = res.size;
  } catch (error) {
    console.error('获取权限列表失败', error);
    ElMessage.error('获取权限列表失败');
  } finally {
    loading.value = false;
  }
};

// 添加权限按钮
const handleAddPermission = () => {
  dialogType.value = 'add';
  Object.keys(permissionForm).forEach(key => {
    if (key === 'isActive') {
      permissionForm[key] = 1;
    } else {
      permissionForm[key] = '';
    }
  });
  dialogVisible.value = true;
};

// 编辑权限
const handleEdit = (row) => {
  dialogType.value = 'edit';
  Object.assign(permissionForm, {
    id: row.id,
    name: row.name,
    identity: row.identity,
    module: row.module,
    isActive: row.isActive === undefined ? 1 : row.isActive,
    description: row.description || ''
  });
  dialogVisible.value = true;
};

// 删除权限
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除"${row.name}"权限吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      await deletePermission(row.id);
      ElMessage.success('删除成功');
      await getPermissionList();
    } catch (error) {
      console.error('删除权限失败', error);
      ElMessage.error('删除权限失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
  });
};

// 提交权限表单
const handleSubmitPermission = async () => {
  if (!permissionFormRef.value) return;

  await permissionFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true;
        const finalForm = {
          name: permissionForm.name,
          identity: permissionForm.identity,
          isActive: permissionForm.isActive,
          description: permissionForm.description
        };

        // 处理新增模块的情况
        if (permissionForm.module === 'add_new' && permissionForm.newModule) {
          finalForm.module = permissionForm.newModule;
          if (!moduleOptions.value.includes(finalForm.module)) {
            moduleOptions.value.push(finalForm.module);
          }
        } else {
          finalForm.module = permissionForm.module;
        }

        if (dialogType.value === 'edit') {
          finalForm.id = permissionForm.id;
          await updatePermission(finalForm);
          ElMessage.success('更新成功');
        } else {
          await addPermission(finalForm);
          ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        await getPermissionList();
      } catch (error) {
        console.error('提交权限数据失败', error);
        ElMessage.error('操作失败，请重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  getPermissionList();
};

// 重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  pagination.currentPage = 1;
  getPermissionList();
};

// 分页大小变化
const handleSizeChange = (val) => {
  pagination.pageSize = val;
  getPermissionList();
};

// 分页页码变化
const handleCurrentChange = (val) => {
  pagination.currentPage = val;
  getPermissionList();
};

// 初始化
onMounted(() => {
  fetchModules();
  getStoredFilterStatus();
  getPermissionList();
});
</script>

<style scoped>
.permission-list {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.filter-card-slide {
  animation: slide-down 0.3s ease;
}

@keyframes slide-down {
  from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    max-height: 500px;
    opacity: 1;
    transform: translateY(0);
  }
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

.batch-actions {
  display: flex;
  gap: 10px;
  margin-left: 10px;
}

.permission-name {
  font-weight: 500;
  color: var(--el-color-primary);
}

.full-width-input {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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

/* 按钮hover效果 */
.table-actions .el-button:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}

@media (max-width: 768px) {
  .permission-list {
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

  .batch-actions {
    margin-top: 10px;
    margin-left: 0;
    width: 100%;
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
}
</style>
