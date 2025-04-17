<template>
  <div class="category-list">
    <el-card v-show="showFilter" :class="{ 'filter-card-slide': showFilter }"
             class="filter-card mb-4">
      <el-form :inline="true" :model="filters" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="categoryStore.pagination.keyword" clearable
                    placeholder="请输入分类名" prefix-icon="Search" size="large"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="categoryStore.loading" type="primary"
                       @click="fetchCategory">查询
            </el-button>
            <el-button :disabled="categoryStore.loading" :icon="Refresh" @click="reset">重置
            </el-button>
            <el-button :disabled="categoryStore.loading" :icon="Plus" type="success"
                       @click="handleAddCategory">添加博客分类
            </el-button>
            <div v-show="selectedRows.length" class="batch-actions">
              <el-button :disabled="categoryStore.loading" :icon="Delete" type="danger"
                         @click="handleBatchDelete">批量删除
              </el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="categoryStore.loading" class="table-card"
             element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">分类列表</div>
        <div class="table-actions">
          <el-tooltip content="展开/收起筛选条件" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="高级搜索" placement="top">
            <el-button :icon="Search" circle text type="primary"
                       @click="showFilter = true"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="categoryStore.loading" circle
                       text type="primary" @click="fetchCategory()"></el-button>
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="multipleTableRef"
        :data="categoryStore.categories"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        stripe
        @selection-change="handleSelectionChange">
        <el-table-column :reserve-selection="true" type="selection" width="55"/>
        <el-table-column align="center" label="分类名" min-width="120" prop="name"
                         show-overflow-tooltip>
          <template #default="scope">
            <span class="category-name">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" label="分类简介" min-width="240" prop="description"
                         show-overflow-tooltip></el-table-column>
        <el-table-column align="center" label="分类排序" prop="sort" width="100">
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
        <el-table-column :class-name="isMobile ? 'hidden-xs-only' : ''" align="center"
                         label="创建时间" min-width="180"
                         prop="createTime"></el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑分类" placement="top">
                <el-button
                  :disabled="categoryStore.loading"
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
                title="确定删除该分类吗？"
                @confirm="handleDelete(scope.row)"
              >
                <template #reference>
                  <el-button
                    :disabled="categoryStore.loading"
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
        <el-pagination
          v-model:current-page="categoryStore.pagination.current"
          v-model:page-size="categoryStore.pagination.size"
          :background="background"
          :disabled="disabled"
          :hide-on-single-page="singlePage"
          :page-sizes="[10, 20, 30, 40]"
          :size="'default'"
          :total="categoryStore.pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialogType === 'add' ? '新增分类' : '编辑分类'"
      v-model="dialogVisible"
      width="600px"
      class="custom-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
        class="optimized-form"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" class="full-width-input" placeholder="请输入分类名称"/>
        </el-form-item>
        <el-form-item label="分类简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类简介"
            class="full-width-input"
          />
        </el-form-item>
        <el-form-item label="排序值" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            controls-position="right"
            class="full-width-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cancel-button" @click="dialogVisible = false">取消</el-button>
          <el-button class="submit-button" type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script lang="ts" setup>
import {ref, reactive, onMounted, computed} from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useCategoryStore } from '#/store/category'
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
    localStorage.setItem('category_filter_status', JSON.stringify(showFilter.value));
  } catch (error) {
    console.error('保存筛选器状态出错:', error);
  }
};

// 获取过滤器状态
const getStoredFilterStatus = () => {
  try {
    const status = localStorage.getItem('category_filter_status');
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

const categoryStore = useCategoryStore()
const keyword = ref('');
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const selectedRows = ref<any[]>([]);
const background = ref(true)
const disabled = ref(false)
const singlePage = ref(false)

const formData = reactive<Category>({
  name: '',
  description: '',
  sort: 0,
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序值不能为空', trigger: 'blur' }],
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

// 重置筛选条件
function reset() {
  keyword.value = '';
  fetchCategory();
}

// 查询分类数据
const fetchCategory = async () => {
  try {
    await categoryStore.fetchCategories();
  } catch (error) {
    console.error('获取分类数据失败：', error);
    ElMessage.error('加载分类数据失败');
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  categoryStore.pagination.size = size
  categoryStore.fetchCategories()
}

const handleCurrentChange = (current: number) => {
  categoryStore.pagination.current = current
  categoryStore.fetchCategories()
}

// 处理表格选择变更
const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val;
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 此处实现批量删除逻辑
    const ids = selectedRows.value.map(item => item.id);
    // 需要实现批量删除API
    //await categoryStore.batchDeleteCategories(ids);
    ElMessage.success('批量删除成功');
    await categoryStore.fetchCategories();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  }
};

// 新增/编辑处理
const handleAddCategory = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    id: undefined,
    name: '',
    description: '',
    sort: 0,
  })
  dialogVisible.value = true
}

const handleEdit = (row: Category) => {
  dialogType.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (dialogType.value === 'add') {
          await categoryStore.addCategory(formData)
          ElMessage.success('新增成功')
        } else {
          await categoryStore.updateCategory(formData)
          ElMessage.success('修改成功')
        }
        dialogVisible.value = false
        await fetchCategory()
      } catch (error) {
        console.error(error)
        ElMessage.error('操作失败')
      }
    }
  })
}

// 删除处理
const handleDelete = async (row: Category) => {
  try {
    await ElMessageBox.confirm(`确定删除分类 "${row.name}" 吗？`, '提示', {
      type: 'warning',
    })
    await categoryStore.deleteCategory(row.id!)
    ElMessage.success('删除成功')
    await fetchCategory()
  } catch (error) {
    console.error(error)
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  getStoredFilterStatus();
  // 在组件挂载后调用
  categoryStore.fetchCategories()
});

</script>


<style scoped>
.category-list {
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

.category-name {
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
  .category-list {
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
