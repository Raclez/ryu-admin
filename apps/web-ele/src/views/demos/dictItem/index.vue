<template>
  <div class="dictItem-list">
    <el-card v-show="showFilter" class="filter-card mb-4">
      <el-form :inline="true" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="filters.keyword" clearable placeholder="请输入字典项名称"
                    prefix-icon="Search"
                    size="large"></el-input>
        </el-form-item>

        <el-form-item class="form-item">
          <el-select v-model="filters.dictTypeId" clearable placeholder="请选择字典类型"
                     size="large" @click="fetchDictType">
            <el-option v-for="item in dictTypeOptions" :key="item.id" :label="item.typeName"
                       :value="item.id"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="loading" type="primary" @click="fetchData">查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="resetSearch">重置</el-button>
            <el-button :disabled="loading" :icon="Plus" type="success" @click="handleAdd">
              新增字典项
            </el-button>
            <el-button
              v-show="selectedRows.length !== 0"
              :disabled="loading"
              :icon="Delete"
              :loading="loading"
              type="danger"
              @click="handleBatchDelete"
            >
              批量删除 {{ selectedRows.length }} 项
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" class="table-card" element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">字典项列表</div>
        <div class="table-actions">
          <el-tooltip content="过滤搜索" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="loading" circle text type="primary"
                       @click="fetchData"></el-button>
          </el-tooltip>
        </div>
      </div>

      <el-table
        :data="tableData"
        :max-height="500"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        @selection-change="handleSelectionChange">
        <el-table-column :reserve-selection="true" type="selection" width="55"/>
        <el-table-column align="center" label="字典项键" min-width="120" prop="dictItemKey"
                         show-overflow-tooltip></el-table-column>
        <el-table-column align="center" label="字典项值" min-width="120" prop="dictItemValue"
                         show-overflow-tooltip></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="字典项类型" min-width="120"
                         prop="dictTypeId" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="getGroupTagType(getDictTypeName(row.dictTypeId))" size="small">
              {{ getDictTypeName(row.dictTypeId) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column align="center" label="排序" prop="sort" width="80">
          <template #default="{ row }">
            <el-progress
              :color="getSortColor(row.sort)"
              :percentage="getSortPercentage(row.sort)"
              :show-text="false"
              :stroke-width="10"
              class="sort-progress"
            />
            <span
              :style="{
                color: row.sort > 50 ? '#e6a23c' : '#409eff',
                fontWeight: row.sort > 50 ? 'bold' : 'normal'
              }"
              class="sort-value"
            >{{ row.sort }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="dark" round>
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="备注" min-width="120"
                         prop="remark" show-overflow-tooltip></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="创建时间" prop="createTime"
                         width="180"></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="更新时间" prop="updateTime"
                         width="180"></el-table-column>
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
                  @click="handleEdit(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该字典项吗？"
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

      <div v-if="tableData.length === 0 && !loading" class="empty-data">
        <el-empty description="暂无数据"/>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :background="true"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogFormVisible"
      :title="dialogType === 'add' ? '新增字典项' : '编辑字典项'"
      :close-on-click-modal="false"
      class="custom-dialog"
      destroy-on-close
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :rules="rules"
        :model="form"
        label-width="100px"
        class="optimized-form"
      >
        <el-row :gutter="24">
          <!-- 字典类型选择 -->
          <el-col :span="24">
            <el-form-item
              class="form-item-compact"
              label="字典类型"
              prop="dictTypeId"
            >
              <el-select
                v-model="form.dictTypeId"
                :disabled="dialogType === 'edit'"
                class="full-width-input"
                clearable
                filterable
                placeholder="请选择字典类型"
                @click="fetchDictTypeOptions"
              >
                <el-option
                  v-for="item in dictTypeOptions"
                  :key="item.id"
                  :label="item.typeName"
                  :value="item.id"
                >
                  <span class="dict-type-option">
                    <el-tag :type="item.status === 1 ? 'success' : 'danger'" class="mr-2"
                            size="small">
                      {{ item.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                    {{ item.typeName }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 字典项键 -->
          <el-col :span="12">
            <el-form-item
              class="form-item-compact"
              label="字典项键"
              prop="dictItemKey"
            >
              <el-input
                v-model="form.dictItemKey"
                :maxlength="50"
                class="full-width-input"
                clearable
                placeholder="请输入字典项键"
                show-word-limit
              />
            </el-form-item>
          </el-col>

          <!-- 字典项值 -->
          <el-col :span="12">
            <el-form-item
              class="form-item-compact"
              label="字典项值"
              prop="dictItemValue"
            >
              <el-input
                v-model="form.dictItemValue"
                :maxlength="50"
                class="full-width-input"
                clearable
                placeholder="请输入字典项值"
                show-word-limit
              />
            </el-form-item>
          </el-col>

          <!-- 排序 -->
          <el-col :span="12">
            <el-form-item
              class="form-item-compact"
              label="排序"
              prop="sort"
            >
              <el-input-number
                v-model="form.sort"
                :max="100"
                :min="0"
                class="full-width-input"
              />
            </el-form-item>
          </el-col>

          <!-- 状态 -->
          <el-col :span="12">
            <el-form-item
              class="form-item-compact"
              label="状态"
              prop="status"
            >
              <el-switch
                v-model="form.status"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                class="status-switch"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>

          <!-- 备注 -->
          <el-col :span="24">
            <el-form-item
              class="form-item-compact"
              label="备注"
              prop="remark"
            >
              <el-input
                v-model="form.remark"
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
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button
            :disabled="submitLoading"
            class="cancel-button"
            @click="handleCancel"
          >取消
          </el-button>
          <el-button
            :loading="submitLoading"
            class="submit-button"
            type="primary"
            @click="handleConfirm"
          >确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script setup lang="ts">
import {onMounted, reactive, ref, computed, watch} from 'vue'
import type {FormInstance} from 'element-plus'
import {ElMessage, ElMessageBox} from 'element-plus'
import {addDictItem, deleteDictItem, getDictItemList, updateDictItem} from '#/api/core/dictItem'
import {getAllDictType} from "#/api/core/dictType";
import {Search, Refresh, Plus, Edit, Delete, Filter} from "@element-plus/icons-vue";
import {useWindowSize} from '@vueuse/core';
import {useTagStore} from '#/store/tag'

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);

// 控制筛选框显示状态
const showFilter = ref(true);

// 切换筛选框显示/隐藏
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  localStorage.setItem('dictItemFilterVisible', showFilter.value.toString());
};

interface DictItem {
  id?: string
  dictTypeId: string
  dictItemKey: string
  dictItemValue: string
  sort: number
  status: number
  remark?: string
}

interface DictType {
  id: string
  typeName: string
  dictType: string
  status: number
}

// 响应式数据
const loading = ref(false)
const tableData = ref<DictItem[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selectedRows = ref<any[]>([])
const dictTypeOptions = ref<DictType[]>([])

const filters = reactive({
  keyword: '',
  dictTypeId: ''
})

// 弹窗相关
const dialogFormVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = reactive<DictItem>({
  dictTypeId: '',
  dictItemKey: '',
  dictItemValue: '',
  sort: 0,
  status: 1,
  remark: ''
})

// 表单验证规则
const rules = reactive({
  dictTypeId: [{required: true, message: '请选择字典类型', trigger: 'change'}],
  dictItemKey: [{required: true, message: '请输入字典项键', trigger: 'blur'}],
  dictItemValue: [{required: true, message: '请输入字典项值', trigger: 'blur'}],
  sort: [{ required: true, message: '请输入排序值', trigger: 'blur' }]
});

// 获取数据
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      keyword: filters.keyword,
      dictTypeId: filters.dictTypeId
    }
    const res = await getDictItemList(params)
    console.log('获取字典项列表成功', res)
    tableData.value = res.records
    total.value = res.total
    currentPage.value = res.current
    pageSize.value = res.size
  } finally {
    loading.value = false
  }
}

// 格式化数字（添加千位分隔符）
const formatNumber = (num: number): string => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

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

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchData()
}

const handlePageChange = (val: number) => {
  currentPage.value = val
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  filters.keyword = ''
  filters.dictTypeId = ''
  currentPage.value = 1
  fetchData()
}

// 新增/编辑处理
const handleAdd = () => {
  dialogType.value = 'add'
  Object.assign(form, {
    id: undefined,
    dictTypeId: '',
    dictItemKey: '',
    dictItemValue: '',
    sort: 0,
    status: 1,
    remark: ''
  })
  dialogFormVisible.value = true
}

const handleEdit = (row: DictItem) => {
  dialogType.value = 'edit'
  Object.assign(form, row)
  dialogFormVisible.value = true
}

// 提交表单
const handleConfirm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        const api = dialogType.value === 'add' ? addDictItem : updateDictItem
        await api(form)
        ElMessage.success(`${dialogType.value === 'add' ? '新增' : '修改'}成功`)
        dialogFormVisible.value = false
        await fetchData()
      } catch (error) {
        console.error(error)
        ElMessage.error('操作失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 处理表格选择变更
const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val;
};

// 删除处理
const handleDelete = async (row: DictItem) => {
  try {
    loading.value = true
    await deleteDictItem(row.id!)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (error) {
    console.error(error)
    ElMessage.error('删除失败')
  } finally {
    loading.value = false
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的项');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定删除选中的${selectedRows.value.length}项吗？`, '提示', {
      type: 'warning'
    });

    loading.value = true;
    // 依次删除选中的行
    for (const row of selectedRows.value) {
      await deleteDictItem(row.id!);
    }
    ElMessage.success('批量删除成功');
    await fetchData();
  } catch (error) {
    console.error('删除失败:', error);
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  } finally {
    loading.value = false;
  }
};

const fetchDictTypeOptions = async () => {
  try {
    if (dictTypeOptions.value.length === 0) {
      const data = await getAllDictType();
      dictTypeOptions.value = data || [];
    }
  } catch (error) {
    console.error('获取字典类型失败:', error);
    ElMessage.error('获取字典类型失败');
  }
}

// 获取字典类型名称
const getDictTypeName = (typeId: string) => {
  const type = dictTypeOptions.value.find(t => t.id === typeId);
  return type ? type.typeName : '未知类型';
};

// 获取标签类型
const getGroupTagType = (name: string) => {
  if (!name) return 'info';
  const types = ['', 'success', 'warning', 'danger', 'info'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return types[hash % types.length];
};

// 监听屏幕尺寸变化，自动在移动设备上隐藏筛选栏
watch(isMobile, (newValue) => {
  if (newValue && showFilter.value) {
    showFilter.value = false;
  }
});


const submitLoading = ref(false);
const background = ref(true);

// 初始化
onMounted(async () => {
  // 从localStorage中恢复筛选框显示状态
  const savedFilterState = localStorage.getItem('tagFilterVisible');
  if (savedFilterState !== null) {
    showFilter.value = savedFilterState === 'true';
  } else {
    // 默认在移动设备上隐藏筛选栏
    showFilter.value = !isMobile.value;
  }

  loading.value = true;
  try {
    await fetchData();
    await fetchDictTypeOptions();
  } finally {
    loading.value = false;
  }
});

// 初始表单状态
const initialFormState = (): DictItem => ({
  dictTypeId: '',
  dictItemKey: '',
  dictItemValue: '',
  sort: 0,
  status: 1,
  remark: ''
});

// 处理对话框关闭
const handleDialogClose = () => {
  Object.assign(form, initialFormState());
};

// 处理取消
const handleCancel = () => {
  dialogFormVisible.value = false;
  handleDialogClose();
};
</script>

<style scoped>
.dictItem-list {
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

.el-input,
.el-select,
.el-date-editor {
  width: 220px;
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

.custom-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 30px;
  border-bottom: 1px solid var(--el-border-color-lighter);
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
}

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

.dict-type-option {
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

@media (max-width: 768px) {
  .dictItem-list {
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

.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
