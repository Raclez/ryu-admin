<template>
  <div class="tag-list">
    <el-card v-show="showFilter" class="filter-card mb-4">
      <el-form :inline="true" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="keyword" clearable placeholder="请输入标签名" prefix-icon="Search"
                    size="large"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="loading" type="primary"
                       @click="tagStore.fetchTags()">查询
            </el-button>
            <el-button :disabled="loading" :icon="Refresh" @click="reset">重置</el-button>
            <el-button :disabled="loading" :icon="Plus" type="success" @click="addTags">
              添加博客标签
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
        <div class="table-title">博客标签列表</div>
        <div class="table-actions">
          <el-tooltip content="过滤搜索" placement="top">
            <el-button :icon="Filter" circle text type="primary" @click="toggleFilter"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="loading" circle text
                       type="primary" @click="tagStore.fetchTags()"></el-button>
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="multipleTableRef"
        :data="tagStore.tags"
        :max-height="500"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        @selection-change="handleSelectionChange">
        <el-table-column :reserve-selection="true" type="selection" width="55"/>
        <el-table-column align="center" label="标签名" min-width="120" prop="name"
                         show-overflow-tooltip></el-table-column>
        <el-table-column align="center" label="标签别名" min-width="120" prop="slug"
                         show-overflow-tooltip></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="标签简介" min-width="180"
                         prop="description" show-overflow-tooltip></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="创建时间" prop="createTime"
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
                  @click="editTags(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该标签吗？"
                @confirm="handlerDeleteTags(scope.row)"
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

      <div v-if="tagStore.tags.length === 0 && !loading" class="empty-data">
        <el-empty description="暂无数据"/>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="tagStore.pagination.current"
          v-model:page-size="tagStore.pagination.size"
          :background="background"
          :page-sizes="[10, 20, 30, 40]"
          :size="'default'"
          :total="tagStore.pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogFormVisible"
      :title="dialogType === 'add' ? '新增博客标签' : '编辑博客标签'"
      class="custom-dialog"
      :close-on-click-modal="false"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="optimized-form"
        label-width="100px"
      >
        <el-row :gutter="20">
          <!-- 标签名称 -->
          <el-col :span="12">
            <el-form-item
              class="form-item-compact"
              label="名称"
              prop="name"
            >
              <el-input
                v-model="form.name"
                :maxlength="10"
                clearable
                placeholder="2-10个字符"
                show-word-limit
                size="large"
              />
            </el-form-item>
          </el-col>

          <!-- 标签别名 -->
          <el-col :span="12">
            <el-form-item
              class="form-item-compact"
              label="唯一标识"
              prop="slug"
            >
              <el-input
                v-model="form.slug"
                clearable
                placeholder="英文/数字组合"
                size="large"
              />
            </el-form-item>
          </el-col>

          <!-- 标签描述 -->
          <el-col :span="24">
            <el-form-item
              class="form-item-compact"
              label="详细描述"
            >
              <el-input
                v-model="form.description"
                :maxlength="50"
                :rows="4"
                placeholder="请输入标签的详细说明（50字以内）"
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
            size="large"
            @click="handleCancel"
          >取消
          </el-button>
          <el-button
            :loading="submitLoading"
            size="large"
            type="primary"
            @click="handleConfirm"
          >确认提交
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed, watch} from 'vue'
import {useTagStore} from '#/store/tag'
import {ElMessage, ElMessageBox} from "element-plus";
import {Search, Refresh, Plus, Edit, Delete, Filter} from "@element-plus/icons-vue";
import {useWindowSize} from '@vueuse/core';

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);

// 控制筛选框显示状态
const showFilter = ref(true);

// 切换筛选框显示/隐藏
const toggleFilter = () => {
  showFilter.value = !showFilter.value;
  localStorage.setItem('tagFilterVisible', showFilter.value.toString());
};

// 状态变量
const tagStore = useTagStore();
const dialogType = ref<'add' | 'edit'>('add');
const loading = ref(false);
const submitLoading = ref(false);
const keyword = ref('');
const dialogFormVisible = ref(false);
const formRef = ref();
const background = ref(true);
const selectedRows = ref<any[]>([]);

// 接口定义
interface Tag {
  id?: string;
  name: string;
  description: string;
  slug: string;
}

// 表单数据
const form = reactive<Tag>({
  name: '',
  description: '',
  slug: ''
});

// 初始表单状态
const initialFormState = (): Tag => ({
  name: '',
  description: '',
  slug: ''
});

// 处理确认提交表单
const handleConfirm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        submitLoading.value = true;
        if (dialogType.value === 'add') {
          await tagStore.saveTag(form);
        } else {
          await tagStore.updateTag(form);
        }
        ElMessage.success(`${dialogType.value === 'add' ? '新增' : '修改'}成功`);
        dialogFormVisible.value = false;
        Object.assign(form, initialFormState());
        await tagStore.fetchTags();
      } catch (error) {
        console.error('提交失败:', error);
        ElMessage.error(`${dialogType.value === 'add' ? '新增' : '修改'}失败`);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

// 处理取消表单
const handleCancel = () => {
  dialogFormVisible.value = false;
  Object.assign(form, initialFormState());
};

// 表单验证规则
const rules = reactive({
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  slug: [{ required: true, message: '请设置标签别名', trigger: 'blur' }]
});

// 分页相关
const handleSizeChange = async (val: number) => {
  tagStore.pagination.size = val;
  loading.value = true;
  try {
    await tagStore.fetchTags();
  } finally {
    loading.value = false;
  }
};

const handleCurrentChange = async (val: number) => {
  tagStore.pagination.current = val;
  loading.value = true;
  try {
    await tagStore.fetchTags();
  } finally {
    loading.value = false;
  }
};

// 处理表格选择变更
const handleSelectionChange = (val: any[]) => {
  selectedRows.value = val;
};

// 重置搜索
const reset = () => {
  keyword.value = '';
  loading.value = true;
  try {
    tagStore.fetchTags();
  } finally {
    loading.value = false;
  }
};

// 添加标签
const addTags = () => {
  dialogType.value = 'add';
  Object.assign(form, initialFormState());
  dialogFormVisible.value = true;
};

// 编辑标签
const editTags = (row: Tag) => {
  dialogType.value = 'edit';
  dialogFormVisible.value = true;
  Object.assign(form, row);
};

// 删除标签
const handlerDeleteTags = async (row: Tag) => {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.name} 吗？`, '警告', {
      type: 'warning'
    });

    loading.value = true;
    await tagStore.deleteTag(row.id!);
    ElMessage.success('删除成功');
    await tagStore.fetchTags();
  } catch (error) {
    console.error(error);
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm('确定批量删除选中的标签吗？', '警告', {
      type: 'warning'
    });

    loading.value = true;
    // 逐个删除选中的标签
    for (const row of selectedRows.value) {
      await tagStore.deleteTag(row.id!);
    }
    ElMessage.success('批量删除成功');
    await tagStore.fetchTags();
  } catch (error) {
    console.error(error);
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  } finally {
    loading.value = false;
  }
};

// 监听屏幕尺寸变化，自动在移动设备上隐藏筛选栏
watch(isMobile, (newValue) => {
  if (newValue && showFilter.value) {
    showFilter.value = false;
  }
});

// 生命周期钩子
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
    await tagStore.fetchTags();
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.tag-list {
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

.form-item-compact {
  margin-bottom: 15px;
}

.optimized-form {
  max-width: 100%;
}

.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

@media (max-width: 768px) {
  .tag-list {
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
</style>
