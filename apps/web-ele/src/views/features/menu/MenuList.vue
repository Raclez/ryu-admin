<template>
  <div class="menu-list">
    <el-card v-show="showFilter" :class="{ 'filter-card-slide': showFilter }"
             class="filter-card mb-4">
      <el-form :inline="true" :model="filters" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="keyword" clearable placeholder="请输入菜单名" prefix-icon="Search"
                    size="large"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="loading" type="primary" @click="fetchMenu">查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="reset">重置</el-button>
            <el-button :disabled="loading" :icon="Plus" type="success" @click="openDialog">
              添加菜单
            </el-button>
            <div v-show="selectedRows.length" class="batch-actions">
              <el-button :disabled="loading" :icon="Delete" type="danger" @click="deleteSelected">
                批量删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="table-card" element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">菜单列表</div>
        <div class="table-actions">
          <el-tooltip content="展开/收起筛选条件" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="高级搜索" placement="top">
            <el-button :icon="Search" circle text type="primary"
                       @click="showFilter = true"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="loading" circle text type="primary"
                       @click="fetchMenu"></el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- 层级表格 -->
      <el-table
        ref="multipleTableRef"
        :data="tableData"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange">
        <el-table-column :reserve-selection="true" type="selection" width="55"/>
        <!-- 可展开子菜单 -->
        <el-table-column type="expand">
          <template #default="scope">
            <div class="expanded-content">
              <el-table
                :data="scope.row.children"
                border
                class="sub-menu-table"
                style="width: 100%;"
              >
                <el-table-column align="center" label="序号" min-width="60">
                  <template #default="scopeChild">
                    <span>{{ scopeChild.$index + 1 }}</span>
                  </template>
                </el-table-column>
                <el-table-column align="center" label="菜单名称" min-width="150">
                  <template #default="scopeChild">
                    <span class="menu-name">{{ scopeChild.row.name }}</span>
                  </template>
                </el-table-column>
                <el-table-column align="center" label="菜单路径" min-width="200"
                                 show-overflow-tooltip>
                  <template #default="scopeChild">
                    <span>{{ scopeChild.row.url }}</span>
                  </template>
                </el-table-column>
                <el-table-column align="center" label="图标" min-width="80">
                  <template #default="scopeChild">
                    <span>{{ scopeChild.row.icon }}</span>
                  </template>
                </el-table-column>
                <el-table-column align="center" label="菜单类型" min-width="150">
                  <template #default="scopeChild">
                    <el-tag :type="getMenuTypeTagType(scopeChild.row.menuType)" size="small">
                      {{ menuTypeMap[scopeChild.row.menuType] || '未知类型' }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column align="center" label="是否启用" min-width="100">
                  <template #default="scopeChild">
                    <el-tag effect="dark" round type="warning">
                      {{ scopeChild.row.isActive ? '启用' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column align="center" label="排序" min-width="100">
                  <template #default="scopeChild">
                    <el-progress
                      :color="getSortColor(scopeChild.row.sort)"
                      :percentage="getSortPercentage(scopeChild.row.sort)"
                      :show-text="false"
                      :stroke-width="10"
                      class="sort-progress"
                    />
                    <span
                      :style="{
                        color: scopeChild.row.sort > 50 ? '#e6a23c' : '#409eff',
                        fontWeight: scopeChild.row.sort > 50 ? 'bold' : 'normal'
                      }"
                      class="sort-value"
                    >{{ scopeChild.row.sort }}</span>
                  </template>
                </el-table-column>
                <el-table-column align="center" fixed="right" label="操作" min-width="160">
                  <template #default="scopeChild">
                    <div class="action-cell">
                      <el-tooltip content="编辑菜单" placement="top">
                        <el-button
                          :disabled="loading"
                          :icon="Edit"
                          circle
                          class="action-button edit-button"
                          size="small"
                          type="primary"
                          @click="handleEdit(scopeChild.row)"
                        ></el-button>
                      </el-tooltip>
                      <el-popconfirm
                        :icon="Delete"
                        cancel-button-text="取消"
                        confirm-button-text="删除"
                        confirm-button-type="danger"
                        icon-color="#F56C6C"
                        title="确定删除该菜单吗？"
                        @confirm="handleDelete(scopeChild.row)"
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
            </div>
          </template>
        </el-table-column>

        <!-- 主表格列 -->
        <el-table-column align="center" label="菜单名称" min-width="150" show-overflow-tooltip>
          <template #default="scope">
            <span class="menu-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="菜单路径" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <span>{{ scope.row.url }}</span>
          </template>
        </el-table-column>
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center" label="图标"
                         min-width="80">
          <template #default="scope">
            <i :class="scope.row.icon"></i>
          </template>
        </el-table-column>

        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="菜单类型"
                         min-width="100">
          <template #default="scope">
            <el-tag :type="getMenuTypeTagType(scope.row.menuType)" size="small">
              {{ menuTypeMap[scope.row.menuType] || '未知类型' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column align="center" label="状态" min-width="80">
          <template #default="scope">
            <el-tag
              :type="scope.row.isActive ? 'success' : 'danger'"
              effect="dark"
              round
            >
              {{ scope.row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center" label="排序"
                         min-width="80">
          <template #default="scope">
            <el-progress
              :color="getSortColor(scope.row.sort)"
              :percentage="getSortPercentage(scope.row.sort)"
              :show-text="false"
              :stroke-width="10"
              class="sort-progress"
            />
            <span
              :style="{
                color: scope.row.sort > 50 ? '#e6a23c' : '#409eff',
                fontWeight: scope.row.sort > 50 ? 'bold' : 'normal'
              }"
              class="sort-value"
            >{{ scope.row.sort }}</span>
          </template>
        </el-table-column>

        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑菜单" placement="top">
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
                title="确定删除该菜单吗？"
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

      <div class="pagination-container">
        <!-- 这里可以添加分页控件，如果需要的话 -->
      </div>
    </el-card>

    <!-- 新增/编辑模态框 -->
    <el-dialog
      v-model="modalVisible"
      :title="isEdit ? '编辑菜单' : '添加菜单'"
      append-to-body
      custom-class="custom-dialog"
      width="600px"
    >
      <el-form ref="formRef" :model="currentMenu" class="optimized-form" label-position="right"
               label-width="120px">
        <el-form-item
          :rules="[{ required: true, message: '请输入菜单名称', trigger: 'blur' }]"
          label="菜单名称"
          prop="name"
        >
          <el-input v-model="currentMenu.name" class="full-width-input"
                    placeholder="请输入菜单名称"/>
        </el-form-item>

        <el-form-item label="父级菜单">
          <el-cascader
            v-model="selectedParent"
            :change-on-select="true"
            :options="tableData"
            :props="cascaderProps"
            class="full-width-input"
            clearable
            placeholder="请选择父级菜单（为空则为顶级菜单）"
          />
        </el-form-item>

        <el-form-item
          label="菜单路径"
          prop="path"
        >
          <el-input v-model="currentMenu.url" class="full-width-input"
                    placeholder="请输入菜单路径"/>
        </el-form-item>

        <el-form-item label="图标" prop="icon">
          <el-input v-model="currentMenu.icon" class="full-width-input"
                    placeholder="请输入图标类名"/>
        </el-form-item>

        <el-form-item label="菜单类型" prop="menuType">
          <el-select v-model="currentMenu.menuType" class="full-width-input"
                     placeholder="请选择菜单类型">
            <el-option :value="0" label="目录"></el-option>
            <el-option :value="1" label="菜单"></el-option>
            <el-option :value="2" label="按钮"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :rules="[{ required: true, message: '请输入排序值', trigger: 'blur' }]"
          label="排序"
          prop="sort"
        >
          <el-input-number v-model="currentMenu.sort" :min="0" class="full-width-input"/>
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="isActiveNumber"
            active-color="#13ce66"
            active-text="启用"
            inactive-color="#ff4949"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-button" @click="closeDialog">取消</el-button>
          <el-button class="submit-button" type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script lang="ts" setup>
defineOptions({
  name: 'MenuManage'
})
import {ref, reactive, onMounted, computed} from 'vue';
import {ElMessage, ElMessageBox} from 'element-plus';
import {getMenusByTree, saveMenu, updateMenu, deleteMenu} from '#/api/core/menu';
import {Search, Refresh, Plus, Edit, Delete, Filter} from "@element-plus/icons-vue";
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
    localStorage.setItem('menu_filter_status', JSON.stringify(showFilter.value));
  } catch (error) {
    console.error('保存筛选器状态出错:', error);
  }
};

// 获取过滤器状态
const getStoredFilterStatus = () => {
  try {
    const status = localStorage.getItem('menu_filter_status');
    if (status !== null) {
      showFilter.value = JSON.parse(status);
    }
  } catch (error) {
    console.error('获取存储的筛选器状态出错:', error);
  }
};

const filters = ref({
  name: ''
});

const loading = ref(false);
const keyword = ref('');
const tableData = ref([]);
// 选中的行用于批量删除
const selectedRows = ref([]);

const multipleTableRef = ref(null);
const modalVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);
// 这里使用一个变量来保存 Cascader 选中的值，设置 emitPath: false 后，它将直接返回选中的菜单 id
const selectedParent = ref(null);

const cascaderProps = {
  value: 'id',
  label: 'name',
  children: 'children',
  checkStrictly: true,
  emitPath: false,
};

interface MenuForm {
  id?: number // 可选类型
  name: string
  url: string
  icon: string
  sort: number
  parentId: number | null
  menuType: number
  isActive: number
}

const currentMenu = reactive(<MenuForm>{
  id: undefined,
  name: '',
  url: '',
  icon: '',
  sort: 0,
  parentId: null,
  menuType: 1,
  isActive: 1,
});

const menuTypeMap: Record<number, string> = {
  0: '目录',
  1: '菜单',
  2: '按钮'
}

const isActiveNumber = computed({
  get: () => currentMenu.isActive === 1, // 1 → true，0 → false
  set: (val) => currentMenu.isActive = val ? 1 : 0
})

// 计算排序百分比
const getSortPercentage = (sort: number): number => {
  if (sort === undefined || sort === null) return 0;
  return Math.min(100, Math.max(0, sort));
}

// 获取排序颜色
const getSortColor = (sort: number): string => {
  if (sort <= 20) return '#909399'; // 灰色
  if (sort <= 50) return '#409EFF'; // 蓝色
  if (sort <= 80) return '#E6A23C'; // 橙色
  return '#F56C6C'; // 红色
}

// 获取菜单类型标签样式
const getMenuTypeTagType = (type: number): string => {
  const types = ['success', 'primary', 'warning'];
  return types[type] || 'info';
}

// 查询菜单数据（支持关键字过滤）
const fetchMenu = async () => {
  try {
    loading.value = true;
    // 调用接口时可以传入查询条件
    const res = await getMenusByTree({keyword: keyword.value});
    tableData.value = res;
  } catch (error) {
    console.error('获取菜单数据失败：', error);
    ElMessage.error('加载菜单数据失败');
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  keyword.value = '';
  fetchMenu();
};

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
};

const deleteSelected = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录');
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 个菜单吗？`,
    '批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      loading.value = true;
      // 批量删除逻辑，遍历 selectedRows 调用删除接口
      for (const row of selectedRows.value) {
        await deleteMenu(row.id);
      }
      ElMessage.success('批量删除成功');
      selectedRows.value = [];
      await fetchMenu();
    } catch (error) {
      console.error('批量删除失败：', error);
      ElMessage.error('批量删除失败');
    } finally {
      loading.value = false;
    }
  }).catch(() => {
    // 用户取消删除
  });
};

const openDialog = () => {
  isEdit.value = false;
  selectedParent.value = null;
  Object.assign(currentMenu, {
    name: '',
    url: '',
    icon: '',
    sort: 0,
    parentId: null,
    menuType: 1,
    isActive: 1,
  });
  modalVisible.value = true;
};

const closeDialog = () => {
  modalVisible.value = false;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        loading.value = true;
        if (isEdit.value) {
          await updateMenu(currentMenu);
          ElMessage.success('菜单更新成功');
        } else {
          await saveMenu(currentMenu);
          ElMessage.success('菜单添加成功');
        }
        closeDialog();
        // 此处可调用刷新列表的方法
        await fetchMenu();
      } catch (error) {
        console.error('提交失败', error);
        ElMessage.error('操作失败');
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  Object.assign(currentMenu, row);
  selectedParent.value = row.parentId;
  modalVisible.value = true;
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 吗？`, '警告', {
      type: 'warning'
    });
    loading.value = true;
    await deleteMenu(row.id);
    ElMessage.success('删除成功');
    await fetchMenu();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error);
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  getStoredFilterStatus();
  fetchMenu();
});
</script>

<style scoped>
.menu-list {
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

.expanded-content {
  padding: 20px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  margin: 10px;
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

.sort-progress {
  width: 80%;
  margin: 0 auto;
}

.sort-value {
  display: block;
  text-align: center;
  margin-top: 3px;
  font-size: 12px;
}

.menu-name {
  font-weight: 500;
  color: var(--el-color-primary);
}

.sub-menu-table {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border-radius: 4px;
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

/* 响应式布局 */
@media (max-width: 768px) {
  .menu-list {
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
