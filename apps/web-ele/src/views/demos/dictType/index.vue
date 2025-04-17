<template>
  <div class="dictType-list">
    <el-card v-show="store.state.showFilter" class="filter-card mb-4">
      <el-form :inline="true" class="filter-container">
        <el-form-item class="form-item">
          <el-input v-model="store.state.filters.typeName" clearable
                    placeholder="请输入字典项类型" prefix-icon="Search" size="large"></el-input>
        </el-form-item>

        <el-form-item>
          <div class="action-buttons">
            <el-button :icon="Search" :loading="store.state.loading" type="primary"
                       @click="store.fetchData()">查询
            </el-button>
            <el-button :disabled="store.state.loading" :icon="Refresh" @click="reset">重置
            </el-button>
            <el-button :disabled="store.state.loading" :icon="Plus" type="success"
                       @click="handleAddDictType">添加字典项类型
            </el-button>
            <el-button
              v-show="store.state.selectedRows.length !== 0"
              :disabled="store.state.loading"
              :icon="Delete"
              :loading="store.state.loading"
              type="danger"
              @click="BatchDelete"
            >
              批量删除 {{ store.state.selectedRows.length }} 项
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="store.state.loading" class="table-card"
             element-loading-background="rgba(0, 0, 0, 0.1)"
             element-loading-text="加载中...">
      <div class="table-header">
        <div class="table-title">字典类型列表</div>
        <div class="table-actions">
          <el-tooltip content="过滤搜索" placement="top">
            <el-button :icon="Filter" circle text type="primary"
                       @click="store.toggleFilter()"></el-button>
          </el-tooltip>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" :loading="store.state.loading" circle
                       text type="primary" @click="store.fetchData()"></el-button>
          </el-tooltip>
        </div>
      </div>

      <el-table
        ref="multipleTableRef"
        :data="store.state.tableData"
        :max-height="500"
        border
        class="responsive-table"
        highlight-current-row
        row-key="id"
        @selection-change="handleSelectionChange">
        <el-table-column :reserve-selection="true" type="selection" width="55"/>
        <el-table-column align="center" label="字典名称" min-width="120" prop="typeName"
                         show-overflow-tooltip></el-table-column>
        <el-table-column align="center" label="字典标识" min-width="120" prop="dictType"
                         show-overflow-tooltip></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="备注" min-width="180"
                         prop="remark" show-overflow-tooltip></el-table-column>
        <el-table-column align="center" label="状态" prop="status" width="100">
          <template #default="{row}">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" effect="dark" round>
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="创建时间" prop="createTime"
                         width="180"></el-table-column>
        <el-table-column :visible="!isMobile" align="center" label="更新时间" prop="updateTime"
                         width="180"></el-table-column>
        <el-table-column align="center" fixed="right" label="操作" width="160">
          <template #default="scope">
            <div class="action-cell">
              <el-tooltip content="编辑" placement="top">
                <el-button
                  :disabled="store.state.loading"
                  :icon="Edit"
                  circle
                  class="action-button edit-button"
                  size="small"
                  type="primary"
                  @click="handleUpdateDictType(scope.row)"
                ></el-button>
              </el-tooltip>
              <el-popconfirm
                :icon="Delete"
                cancel-button-text="取消"
                confirm-button-text="删除"
                confirm-button-type="danger"
                icon-color="#F56C6C"
                title="确定删除该字典类型吗？"
                @confirm="handlerDeleteDictType(scope.row)"
              >
                <template #reference>
                  <el-button
                    :disabled="store.state.loading"
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

      <div v-if="store.state.tableData.length === 0 && !store.state.loading" class="empty-data">
        <el-empty description="暂无数据"/>
      </div>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="store.state.currentPage"
          v-model:page-size="store.state.pageSize"
          :background="background"
          :disabled="disabled"
          :hide-on-single-page="singlePage"
          :page-sizes="[10, 20, 30, 40]"
          :size="'default'"
          :total="store.state.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      :title="dialogType === 'add' ? '新增字典类型' : '编辑字典类型'"
      v-model="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
      class="custom-dialog"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="字典名称" prop="typeName">
          <el-input v-model="formData.typeName" />
        </el-form-item>
        <el-form-item label="字典标识" prop="dictType">
          <el-input v-model="formData.dictType" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="上架"
            inactive-text="下架"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button :disabled="submitLoading" @click="dialogVisible = false">取消</el-button>
          <el-button :loading="submitLoading" type="primary" @click="submitForm">确认</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 回到顶部按钮 -->
    <el-backtop :bottom="20" :right="20"/>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted, computed, watch} from 'vue';
import {
  getDictTypePage,
  addDictType,
  updateDictType,
  deleteDictType,
  batchDeleteDictType
} from "#/api/core/dictType";
import {ElMessage, ElMessageBox} from 'element-plus';
import {Search, Refresh, Plus, Edit, Delete, Filter} from "@element-plus/icons-vue";
import {useWindowSize} from '@vueuse/core';
import {useDictTypeStore} from '#/store/dictType'

const store = useDictTypeStore()

// 响应式检测窗口大小
const {width} = useWindowSize();
const isMobile = computed(() => width.value < 768);


const background = ref(true);
const disabled = ref(false);
const singlePage = ref(false);

const submitLoading = ref(false);
const typeName = ref('');



interface DictType {
  id: string
  typeName: string
  dictType: string
  remark: string
  status: number
}

// 对话框相关
const dialogVisible = ref(false);
const dialogType = ref<'add' | 'edit'>('add');
const formRef = ref();

// 表单数据
const formData = reactive<DictType>({
  id: '',
  typeName: '',
  dictType: '',
  remark: '',
  status: 1
});

// 表单验证规则
const rules = {
  typeName: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dictType: [{ required: true, message: '请输入字典标识', trigger: 'blur' }]
};


// 处理表格选择变更
const handleSelectionChange = (val: DictType[]) => {
  selectedRows.value = val;
};

// 批量删除
const BatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的项');
    return;
  }

  try {
    await ElMessageBox.confirm(`确定删除选中的${selectedRows.value.length}项吗？`, '提示', {
      type: 'warning'
    });

    await handleBatchDelete()
    ElMessage.success('删除成功');
  } catch (error) {
    console.error('删除失败:', error);
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 分页相关
const handleSizeChange = (val: number) => {
  store.state.pageSize = val;
  store.fetchData()
};

const handleCurrentChange = (val: number) => {
  store.state.currentPage = val;
  store.fetchData()
};

// 重置功能
const reset = () => {
  store.state.filters.typeName = ''
  store.state.currentPage = 1;
  store.state.pageSize = 10;
  store.fetchData()
};

// 添加字典类型
const handleAddDictType = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    id: '',
    typeName: '',
    dictType: '',
    remark: '',
    status: 1
  })
  dialogVisible.value = true
};

// 修改字典类型
const handleUpdateDictType = (row: DictType) => {
  dialogType.value = 'edit';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        submitLoading.value = true;
        // 创建新对象排除id字段
        const submitData = dialogType.value === 'add'
          ? {...formData, id: undefined}
          : formData;

        const api = dialogType.value === 'add' ? addDictType : updateDictType;
        await api(submitData);
        ElMessage.success(`${dialogType.value === 'add' ? '添加' : '修改'}成功`);
        dialogVisible.value = false;
        await store.fetchData();
      } catch (error) {
        console.error(error);
        ElMessage.error(`${dialogType.value === 'add' ? '添加' : '修改'}失败`);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

//删除字典类型
const handlerDeleteDictType = async (row: DictType) => {
  try {
    await deleteDictType(row.id!)
    ElMessage.success('删除成功');
    await store.fetchData()
  } catch (error) {
    console.error(error);
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 监听屏幕尺寸变化，自动在移动设备上隐藏筛选栏
watch(isMobile, (newValue) => {
  if (newValue && store.state.showFilter) {
    store.state.showFilter = false;
  }
});

// 生命周期钩子
onMounted(() => {
  store.initFilterState()

  store.fetchData()
});
</script>

<style scoped>
.dictType-list{
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

@media (max-width: 768px) {
  .dictType-list {
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
